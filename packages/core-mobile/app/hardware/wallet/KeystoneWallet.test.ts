import { KeystoneDataStorageType } from 'features/keystone/storage/KeystoneDataStorage'
import { Curve } from 'utils/publicKeys'
import { BitcoinProvider } from '@avalabs/core-wallets-sdk'
import KeystoneWallet from './KeystoneWallet'
import { signer } from './keystoneSigner'

const MockedKeystoneData: KeystoneDataStorageType = {
  evm: 'xpub661MyMwAqRbcGSmFWVZk2h773zMrcPFqDUWi7cFRpgPhfn7y9HEPzPsBDEXYxAWfAoGo7E7ijjYfB3xAY86MYzfvGLDHmcy2epZKNeDd4uQ',
  xp: 'xpub661MyMwAqRbcFFDMuFiGQmA1EqWxxgDLdtNvxxiucf9qkfoVrvwgnYyshxWoewWtkZ1aLhKoVDrpeDvn1YRqxX2szhGKi3UiSEv1hYRMF8q',
  mfp: '1250b6bc'
}

jest.mock('./keystoneSigner.ts', () => ({
  signer: jest.fn().mockImplementation(async () => '0xmockedsignature')
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

  describe('getSigner', () => {
    it('should sign BTC transaction successfully', async () => {
      const result = await wallet.signBtcTransaction({
        accountIndex: 0,
        transaction: { inputs: [], outputs: [] },
        network: { vmName: 'BITCOIN' } as any,
        provider: new BitcoinProvider()
      })

      expect(typeof result).toBe('string')
      expect(signer).toHaveBeenCalled()
      expect(result).toBe('0xmockedsignature')
    })
  })
})
