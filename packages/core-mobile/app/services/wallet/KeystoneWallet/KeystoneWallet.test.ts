import { KeystoneDataStorageType } from 'features/keystone/storage/KeystoneDataStorage'
import { Curve } from 'utils/publicKeys'
import { BitcoinProvider } from '@avalabs/core-wallets-sdk'
import KeystoneWallet from 'services/wallet/KeystoneWallet'
import { KeystoneErrors } from 'services/wallet/KeystoneWallet/errors'

jest.mock('@avalabs/core-wallets-sdk', () => ({
  ...jest.requireActual('@avalabs/core-wallets-sdk'),
  BitcoinProvider: jest.fn().mockImplementation(() => ({
    getNetwork: jest.fn()
  }))
}))

const MockedKeystoneData: KeystoneDataStorageType = {
  evm: 'xpub661MyMwAqRbcGSmFWVZk2h773zMrcPFqDUWi7cFRpgPhfn7y9HEPzPsBDEXYxAWfAoGo7E7ijjYfB3xAY86MYzfvGLDHmcy2epZKNeDd4uQ',
  xp: 'xpub661MyMwAqRbcFFDMuFiGQmA1EqWxxgDLdtNvxxiucf9qkfoVrvwgnYyshxWoewWtkZ1aLhKoVDrpeDvn1YRqxX2szhGKi3UiSEv1hYRMF8q',
  mfp: '1250b6bc'
}

jest.mock('./keystoneSigner.ts', () => ({
  signer: jest.fn().mockImplementation(async () => '0xmockedsignature')
}))

// Stub the Keystone QR codec so EVM signing runs end-to-end through the real
// tx-building + mfp path (the `DataType` enum is otherwise undefined under jest).
// The mocked `signer` above resolves the signature, so the codec internals are
// not exercised — this keeps the EVM-without-xp regression test focused.
jest.mock('@keystonehq/bc-ur-registry-eth', () => ({
  DataType: { transaction: 1, typedTransaction: 2 },
  RegistryTypes: {},
  CryptoPSBT: jest.fn(),
  ETHSignature: { fromCBOR: jest.fn() },
  EthSignRequest: {
    constructETHRequest: jest.fn(() => ({ toUR: jest.fn(() => ({})) }))
  }
}))

describe('KeystoneWallet', () => {
  let wallet: KeystoneWallet

  beforeEach(() => {
    wallet = new KeystoneWallet(MockedKeystoneData)
  })

  it('should have returned the evm xpub', async () => {
    expect(wallet.xpub).toEqual(MockedKeystoneData.evm)
  })

  it('should have returned the xp xpub', async () => {
    expect(wallet.xpubXP).toEqual(MockedKeystoneData.xp)
  })

  it('should have returned the mfp', async () => {
    expect(wallet.mfp).toEqual(MockedKeystoneData.mfp)
  })

  it('throws when the X/P xpub is absent (undefined)', () => {
    const walletWithoutXp = new KeystoneWallet({
      evm: MockedKeystoneData.evm,
      mfp: MockedKeystoneData.mfp
    })
    expect(() => walletWithoutXp.xpubXP).toThrow(
      'no public key (xpubXP) available'
    )
  })

  it('throws when the X/P xpub is an empty string (fails closed)', () => {
    const walletWithEmptyXp = new KeystoneWallet({
      ...MockedKeystoneData,
      xp: ''
    })
    expect(() => walletWithEmptyXp.xpubXP).toThrow(
      'no public key (xpubXP) available'
    )
  })

  it('signs an EVM transaction when the X/P xpub is absent (regression: EVM must not depend on xp)', async () => {
    const walletWithoutXp = new KeystoneWallet({
      evm: MockedKeystoneData.evm,
      mfp: MockedKeystoneData.mfp
    })
    const evmTx = {
      chainId: 43114,
      nonce: 0,
      to: '0x45A62B090DF48243F12A21897e7ed91863E2c86b',
      value: '0x0',
      data: '0x',
      gasLimit: '0x5208',
      maxFeePerGas: '0x6fc23ac00',
      maxPriorityFeePerGas: '0x59682f00'
    }

    const signed = await walletWithoutXp.signEvmTransaction({
      accountIndex: 0,
      transaction: evmTx
    } as unknown as Parameters<KeystoneWallet['signEvmTransaction']>[0])

    expect(signed).toBe('0xmockedsignature')
  })

  it('should have returned the correct public key', async () => {
    const evmPublicKey = await wallet.getPublicKeyFor({
      derivationPath: `m/44'/60'/0'/0/1`,
      curve: Curve.SECP256K1
    })
    expect(evmPublicKey).toEqual(
      '0341f20093c553b2aa95dd57449532b85480de93a9aaa225a391dcfe8679e33f50'
    )
    const xpPublicKey = await wallet.getPublicKeyFor({
      derivationPath: `m/44'/9000'/0'/0/1`,
      curve: Curve.SECP256K1
    })
    expect(xpPublicKey).toEqual(
      '034814b89f62338b37881a71ffe40cdd29752241560b861a7086ac711fa7a8fe79'
    )
  })

  it('throws a typed UNSUPPORTED_XP_DERIVATION error for a non-primary X/P path', async () => {
    // Keystone QR wallets only carry the depth-3 account-0 X/P xpub
    // (m/44'/9000'/0'), so per-account X/P paths (m/44'/9000'/N'/0/0, N > 0)
    // cannot be derived. The error must be distinguishable so address
    // derivation can omit X/P for the account rather than failing closed.
    await expect(
      wallet.getPublicKeyFor({
        derivationPath: `m/44'/9000'/1'/0/0`,
        curve: Curve.SECP256K1
      })
    ).rejects.toMatchObject({
      name: KeystoneErrors.UNSUPPORTED_XP_DERIVATION
    })
  })

  it('still throws a generic error for a truly unknown derivation path', async () => {
    // Only the AVAX coin type (m/44'/9000'/...) maps to the X/P-unsupported
    // sentinel; any other unknown path stays a generic failure.
    await expect(
      wallet.getPublicKeyFor({
        derivationPath: `m/44'/1'/0'/0/0`,
        curve: Curve.SECP256K1
      })
    ).rejects.toMatchObject({ name: 'Error' })
  })

  describe('getSigner', () => {
    it('should sign BTC transaction successfully', async () => {
      const signBtcTransactionMock = jest
        .spyOn(wallet, 'signBtcTransaction')
        .mockResolvedValue('0xmockedBtcSignature')

      const result = await wallet.signBtcTransaction({
        accountIndex: 0,
        transaction: { inputs: [], outputs: [] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        network: { vmName: 'BITCOIN' } as any,
        provider: new BitcoinProvider()
      })

      expect(signBtcTransactionMock).toHaveBeenCalled()
      expect(typeof result).toBe('string')
      expect(result).toBe('0xmockedBtcSignature')
      signBtcTransactionMock.mockRestore()
    })
  })
})
