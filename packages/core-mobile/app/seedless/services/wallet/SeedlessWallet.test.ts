import * as cs from '@cubist-labs/cubesigner-sdk'
import * as WalletSDK from '@avalabs/wallets-sdk'
import { RpcMethod } from 'store/walletConnectV2'
import CoreSeedlessAPIService from '../CoreSeedlessAPIService'
import SeedlessWallet from './SeedlessWallet'

jest.spyOn(CoreSeedlessAPIService, 'addAccount').mockResolvedValue()

const keys = async () => [
  {
    id: 'testId',
    publicKey: '0xtestPublicKey',
    derivation_info: { mnemonic_id: 'testMnemonicId' },
    material_id: 'testMaterialId',
    key_type: 'testKeyType'
  }
]

describe('SeedlessWallet', () => {
  let wallet: SeedlessWallet
  beforeEach(() => {
    wallet = new SeedlessWallet(
      {
        proveIdentity: jest.fn(),
        // @ts-ignore
        keys
      },
      { evm: 'testPublicKey' }
    )
  })
  it('should have returned the mnemonic id', async () => {
    // @ts-ignore
    const mnemonicId = await wallet.getMnemonicId()
    expect(mnemonicId).toEqual('testMnemonicId')
  })
  it('should have thrown for not found mnemonic id ', async () => {
    wallet = new SeedlessWallet(
      {
        // @ts-ignore
        keys: () => []
      },
      { evm: 'testPublicKey' }
    )
    try {
      // @ts-ignore
      await wallet.getMnemonicId()
    } catch (error) {
      expect(error).toHaveProperty('message', 'Cannot retrieve the mnemonic id')
    }
  })
  it('should have returned the signing key by address', async () => {
    // @ts-ignore
    const key = await wallet.getSigningKeyByAddress('testMaterialId')
    expect(key.id).toEqual('testId')
  })
  it('should have thrown for not found material id', async () => {
    try {
      // @ts-ignore
      await wallet.getSigningKeyByAddress('testWrongMaterialId')
    } catch (error) {
      expect(error).toHaveProperty('message', 'Signing key not found')
    }
  })
  it('should have returned the signing key by type and public key', async () => {
    // @ts-ignore
    const key = await wallet.getSigningKeyByTypeAndKey(
      'testKeyType' as cs.Secp256k1,
      'testPublicKey'
    )
    expect(key.id).toEqual('testId')
  })
  it('should have thrown for not found type and public key', async () => {
    try {
      // @ts-ignore
      await wallet.getSigningKeyByTypeAndKey(
        'testKeyType' as cs.Secp256k1,
        'testPublicKey'
      )
    } catch (error) {
      expect(error).toHaveProperty('message', 'Signing key not found')
    }
  })
  it('should have thrown for missing public key', async () => {
    try {
      // @ts-ignore
      await wallet.getSigningKeyByTypeAndKey('testKeyType' as cs.Secp256k1)
    } catch (error) {
      expect(error).toHaveProperty('message', 'Public key not available')
    }
  })

  describe('addAccount', () => {
    it('should have called CoreSeedlessAPIService addAccount', async () => {
      await wallet.addAccount(1)
      expect(CoreSeedlessAPIService.addAccount).toHaveBeenCalled()
    })
    it('should have thrown with incorrect account index', async () => {
      try {
        await wallet.addAccount(0)
      } catch (error) {
        expect(error).toHaveProperty(
          'message',
          'Account index must be greater than or equal to 1'
        )
      }
    })
    it('should have thrown with unknown identity', async () => {
      const signerSession = {
        proveIdentity: jest
          .fn()
          .mockRejectedValue(new Error('Unknown identity')),
        keys
      }
      // @ts-ignore
      const walletWithMockSignerSession = new SeedlessWallet(signerSession, {
        evm: 'testPublicKey'
      })
      try {
        await walletWithMockSignerSession.addAccount(1)
      } catch (error) {
        expect(error).toHaveProperty('message', 'Unknown identity')
      }
    })
    it('should have thrown with unknown mnemonic id', async () => {
      const signerSession = {
        proveIdentity: jest.fn(),
        keys
      }
      // @ts-ignore
      const walletWithMockSignerSession = new SeedlessWallet(signerSession, {
        evm: 'testWrongPublicKey'
      })
      try {
        await walletWithMockSignerSession.addAccount(1)
      } catch (error) {
        expect(error).toHaveProperty(
          'message',
          'Cannot retrieve the mnemonic id'
        )
      }
    })
  })

  describe.skip('signMessage', () => {
    jest
      .spyOn(WalletSDK, 'getEvmAddressFromPubKey')
      .mockReturnValue('0xtestAddress')
    it('should have signed the message', async () => {
      await wallet.signMessage({
        rpcMethod: RpcMethod.ETH_SIGN,
        data: '0x03testData'
      })
      // expect(wallet.signBlob).toHaveBeenCalled()
    })
  })
})
