import * as cs from '@cubist-labs/cubesigner-sdk'
import { Curve } from 'utils/publicKeys'
import CoreSeedlessAPIService from '../CoreSeedlessAPIService'
import SeedlessService from '../SeedlessService'
import { SeedlessPubKeysStorage } from '../storage/SeedlessPubKeysStorage'
import SeedlessWallet from './SeedlessWallet'

jest.spyOn(CoreSeedlessAPIService, 'addAccount').mockResolvedValue()

const mockSessionKeysList = jest.fn()
jest
  .spyOn(SeedlessService.session, 'getSignerClient')
  // @ts-expect-error
  .mockImplementation(() => {
    return {
      apiClient: {
        sessionKeysList: mockSessionKeysList.mockReturnValue([])
      }
    }
  })

jest.mock('../transformKeyInfosToPubkeys', () => ({
  transformKeyInfosToPubKeys: jest.fn()
}))
jest.spyOn(SeedlessPubKeysStorage, 'save').mockResolvedValue()

// getPublicKeyFor now reads keys from SeedlessPubKeysStorage rather than a
// constructor snapshot, so the wallet's key lookups go through retrieve().
const defaultPubKeys = [
  {
    curve: Curve.SECP256K1,
    derivationPath: "m/44'/60'/0'/0/0",
    key: 'testPublicKey'
  }
]
const mockRetrieve = jest
  .spyOn(SeedlessPubKeysStorage, 'retrieve')
  .mockResolvedValue(defaultPubKeys)

const sessionKeysList = async () => [
  {
    key_id: 'testId',
    public_key: '0xtestPublicKey',
    derivation_info: { mnemonic_id: 'testMnemonicId' },
    material_id: 'testMaterialId',
    key_type: 'testKeyType'
  }
]

describe('SeedlessWallet', () => {
  let wallet: SeedlessWallet
  beforeEach(() => {
    mockRetrieve.mockResolvedValue(defaultPubKeys)
    wallet = new SeedlessWallet({
      apiClient: {
        identityProve: jest.fn(),
        // @ts-ignore
        sessionKeysList
      }
      // @ts-ignore
    })
  })
  it('should have returned the mnemonic id', async () => {
    // @ts-ignore
    const mnemonicId = await wallet.getMnemonicId()
    expect(mnemonicId).toEqual('testMnemonicId')
  })
  it('should have thrown for not found mnemonic id ', async () => {
    wallet = new SeedlessWallet({
      apiClient: {
        identityProve: jest.fn(),
        // @ts-ignore
        sessionKeysList: () => []
      }
      // @ts-ignore
    })
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
    expect(key.key_id).toEqual('testId')
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
    expect(key.key_id).toEqual('testId')
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

  describe('getPublicKeyFor', () => {
    it('returns the latest key from storage', async () => {
      mockRetrieve.mockResolvedValue([
        {
          curve: Curve.SECP256K1,
          derivationPath: "m/44'/60'/0'/0/0",
          key: 'latestKeyFromStorage'
        }
      ])
      const key = await wallet.getPublicKeyFor({
        derivationPath: "m/44'/60'/0'/0/0",
        curve: Curve.SECP256K1
      })
      expect(key).toEqual('latestKeyFromStorage')
      expect(SeedlessPubKeysStorage.retrieve).toHaveBeenCalled()
    })
    it('throws when storage has no matching key', async () => {
      mockRetrieve.mockResolvedValue([])
      await expect(
        wallet.getPublicKeyFor({
          derivationPath: "m/44'/60'/0'/0/0",
          curve: Curve.SECP256K1
        })
      ).rejects.toThrow('Public key not found')
    })
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
      const client = {
        apiClient: {
          identityProve: jest
            .fn()
            .mockRejectedValue(new Error('Unknown identity')),
          sessionKeysList
        }
      }
      // @ts-ignore
      const walletWithMockClient = new SeedlessWallet(client)
      try {
        await walletWithMockClient.addAccount(1)
      } catch (error) {
        expect(error).toHaveProperty('message', 'Unknown identity')
      }
    })
    it('should have thrown with unknown mnemonic id', async () => {
      // Stored key doesn't match any session key, so the mnemonic id lookup
      // finds nothing.
      mockRetrieve.mockResolvedValue([
        {
          curve: Curve.SECP256K1,
          derivationPath: "m/44'/60'/0'/0/0",
          key: 'testWrongPublicKey'
        }
      ])
      const client = {
        apiClient: {
          identityProve: jest.fn(),
          sessionKeysList
        }
      }
      // @ts-ignore
      const walletWithMockClient = new SeedlessWallet(client)
      try {
        await walletWithMockClient.addAccount(1)
      } catch (error) {
        expect(error).toHaveProperty(
          'message',
          'Cannot retrieve the mnemonic id'
        )
      }
    })
  })
})
