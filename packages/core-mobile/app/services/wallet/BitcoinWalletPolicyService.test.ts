import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { Curve } from 'utils/publicKeys'
import { PublicKey } from 'services/ledger/types'
import { BtcWalletPolicyDetails } from '@avalabs/vm-module-types'

// Mock dependencies before imports
jest.mock('@avalabs/core-wallets-sdk', () => ({
  createWalletPolicy: jest.fn()
}))

jest.mock('utils/BiometricsSDK', () => ({
  __esModule: true,
  default: {
    loadWalletSecret: jest.fn(),
    storeWalletSecret: jest.fn()
  }
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}))

jest.mock('./utils', () => ({
  getAddressDerivationPath: jest.fn()
}))

// Import after mocking
import { createWalletPolicy } from '@avalabs/core-wallets-sdk'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import { getAddressDerivationPath } from './utils'
import { BitcoinWalletPolicyService } from './BitcoinWalletPolicyService'

// Get mock references
const mockCreateWalletPolicy = createWalletPolicy as jest.Mock
const mockLoadWalletSecret = BiometricsSDK.loadWalletSecret as jest.Mock
const mockStoreWalletSecret = BiometricsSDK.storeWalletSecret as jest.Mock
const mockGetAddressDerivationPath = getAddressDerivationPath as jest.Mock

describe('BitcoinWalletPolicyService', () => {
  // Sample data for tests
  const mockWalletId = 'test-wallet-id'

  const mockBtcPolicy: BtcWalletPolicyDetails = {
    hmacHex: 'abc123def456',
    masterFingerprint: '0x12345678',
    xpub: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtyPWKiKbERr4FqXdCqjrzN6TzbxQi2jPe8YQPCW9ZXAN7CCUNJfrCvQJDivQPw4qvdRyZL3sKRfqv9WwLxT',
    name: 'Core - Account 1'
  }

  const mockPublicKeys: PublicKey[] = [
    {
      key: 'evm-public-key',
      derivationPath: "m/44'/60'/0'/0/0",
      curve: Curve.SECP256K1,
      btcWalletPolicy: mockBtcPolicy
    },
    {
      key: 'avalanche-public-key',
      derivationPath: "m/44'/9000'/0'/0/0",
      curve: Curve.SECP256K1
    },
    {
      key: 'solana-public-key',
      derivationPath: "m/44'/501'/0'/0'",
      curve: Curve.ED25519
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/0'/0/0")
    mockCreateWalletPolicy.mockReturnValue({
      name: 'Test Policy',
      descriptor: 'wpkh(@0/**)',
      keys: []
    })
  })

  describe('parseWalletPolicyDetailsFromPublicKey', () => {
    it('should parse wallet policy details correctly', () => {
      const result =
        BitcoinWalletPolicyService.parseWalletPolicyDetailsFromPublicKey(
          mockBtcPolicy,
          0
        )

      expect(result.hmac).toBeInstanceOf(Buffer)
      expect(result.hmac.toString('hex')).toBe('abc123def456')
      expect(mockCreateWalletPolicy).toHaveBeenCalledWith(
        '0x12345678',
        0,
        mockBtcPolicy.xpub,
        'Core - Account 1'
      )
      expect(result.policy).toBeDefined()
    })

    it('should use provided account index', () => {
      BitcoinWalletPolicyService.parseWalletPolicyDetailsFromPublicKey(
        mockBtcPolicy,
        5
      )

      expect(mockCreateWalletPolicy).toHaveBeenCalledWith(
        '0x12345678',
        5,
        mockBtcPolicy.xpub,
        'Core - Account 1'
      )
    })

    it('should default to account index 0 when not provided', () => {
      BitcoinWalletPolicyService.parseWalletPolicyDetailsFromPublicKey(
        mockBtcPolicy
      )

      expect(mockCreateWalletPolicy).toHaveBeenCalledWith(
        '0x12345678',
        0,
        mockBtcPolicy.xpub,
        'Core - Account 1'
      )
    })

    it('should throw error when btcWalletPolicy is undefined', () => {
      expect(() =>
        BitcoinWalletPolicyService.parseWalletPolicyDetailsFromPublicKey(
          undefined as any
        )
      ).toThrow('Bitcoin wallet policy details not found in public key data.')
    })

    it('should throw error when btcWalletPolicy is null', () => {
      expect(() =>
        BitcoinWalletPolicyService.parseWalletPolicyDetailsFromPublicKey(
          null as any
        )
      ).toThrow('Bitcoin wallet policy details not found in public key data.')
    })

    it('should correctly convert hex string to buffer', () => {
      const policyWithShortHex = {
        ...mockBtcPolicy,
        hmacHex: 'ff00'
      }

      const result =
        BitcoinWalletPolicyService.parseWalletPolicyDetailsFromPublicKey(
          policyWithShortHex
        )

      expect(result.hmac.toString('hex')).toBe('ff00')
      expect(result.hmac.length).toBe(2)
    })
  })

  describe('findBtcWalletPolicyInPublicKeys', () => {
    it('should find Bitcoin wallet policy for account 0', () => {
      mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/0'/0/0")

      const result = BitcoinWalletPolicyService.findBtcWalletPolicyInPublicKeys(
        mockPublicKeys,
        0
      )

      expect(mockGetAddressDerivationPath).toHaveBeenCalledWith({
        accountIndex: 0,
        vmType: NetworkVMType.EVM
      })
      expect(result).toEqual(mockBtcPolicy)
    })

    it('should find Bitcoin wallet policy for different account indices', () => {
      const publicKeysWithAccount1: PublicKey[] = [
        {
          key: 'evm-public-key-account-1',
          derivationPath: "m/44'/60'/1'/0/0",
          curve: Curve.SECP256K1,
          btcWalletPolicy: {
            ...mockBtcPolicy,
            name: 'Core - Account 2'
          }
        }
      ]

      mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/1'/0/0")

      const result = BitcoinWalletPolicyService.findBtcWalletPolicyInPublicKeys(
        publicKeysWithAccount1,
        1
      )

      expect(mockGetAddressDerivationPath).toHaveBeenCalledWith({
        accountIndex: 1,
        vmType: NetworkVMType.EVM
      })
      expect(result?.name).toBe('Core - Account 2')
    })

    it('should return undefined when no matching public key found', () => {
      mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/99'/0/0")

      const result = BitcoinWalletPolicyService.findBtcWalletPolicyInPublicKeys(
        mockPublicKeys,
        99
      )

      expect(result).toBeUndefined()
    })

    it('should return undefined when public key has no btcWalletPolicy', () => {
      const publicKeysWithoutPolicy: PublicKey[] = [
        {
          key: 'evm-public-key',
          derivationPath: "m/44'/60'/0'/0/0",
          curve: Curve.SECP256K1
          // No btcWalletPolicy
        }
      ]

      mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/0'/0/0")

      const result = BitcoinWalletPolicyService.findBtcWalletPolicyInPublicKeys(
        publicKeysWithoutPolicy,
        0
      )

      expect(result).toBeUndefined()
    })

    it('should only match SECP256K1 curve keys', () => {
      const publicKeysWithWrongCurve: PublicKey[] = [
        {
          key: 'ed25519-key',
          derivationPath: "m/44'/60'/0'/0/0",
          curve: Curve.ED25519,
          btcWalletPolicy: mockBtcPolicy
        }
      ]

      mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/0'/0/0")

      const result = BitcoinWalletPolicyService.findBtcWalletPolicyInPublicKeys(
        publicKeysWithWrongCurve,
        0
      )

      expect(result).toBeUndefined()
    })

    it('should handle empty public keys array', () => {
      const result = BitcoinWalletPolicyService.findBtcWalletPolicyInPublicKeys(
        [],
        0
      )

      expect(result).toBeUndefined()
    })
  })

  describe('storeBtcWalletPolicy', () => {
    const mockWalletData = {
      deviceId: 'test-device',
      publicKeys: mockPublicKeys
    }

    beforeEach(() => {
      mockLoadWalletSecret.mockResolvedValue({
        success: true,
        value: JSON.stringify(mockWalletData)
      })
      mockStoreWalletSecret.mockResolvedValue(true)
      mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/0'/0/0")
    })

    it('should successfully store Bitcoin wallet policy', async () => {
      const result = await BitcoinWalletPolicyService.storeBtcWalletPolicy({
        walletId: mockWalletId,
        publicKeys: mockPublicKeys,
        policyDetails: mockBtcPolicy,
        accountIndex: 0
      })

      expect(result).toBe(true)
      expect(mockLoadWalletSecret).toHaveBeenCalledWith(mockWalletId)
      expect(mockStoreWalletSecret).toHaveBeenCalledWith(
        mockWalletId,
        expect.any(String)
      )
      expect(Logger.info).toHaveBeenCalledWith(
        'Successfully stored Bitcoin wallet policy details'
      )
    })

    it('should update correct public key with policy details', async () => {
      await BitcoinWalletPolicyService.storeBtcWalletPolicy({
        walletId: mockWalletId,
        publicKeys: mockPublicKeys,
        policyDetails: mockBtcPolicy,
        accountIndex: 0
      })

      const storedData = JSON.parse(
        (mockStoreWalletSecret as jest.Mock).mock.calls[0][1]
      )

      expect(storedData.publicKeys).toBeDefined()
      expect(storedData.publicKeys.length).toBe(mockPublicKeys.length)

      // Find the EVM key
      const evmKey = storedData.publicKeys.find(
        (pk: PublicKey) =>
          pk.curve === Curve.SECP256K1 &&
          pk.derivationPath === "m/44'/60'/0'/0/0"
      )
      expect(evmKey?.btcWalletPolicy).toEqual(mockBtcPolicy)
    })

    it('should preserve other public keys unchanged', async () => {
      await BitcoinWalletPolicyService.storeBtcWalletPolicy({
        walletId: mockWalletId,
        publicKeys: mockPublicKeys,
        policyDetails: mockBtcPolicy,
        accountIndex: 0
      })

      const storedData = JSON.parse(
        (mockStoreWalletSecret as jest.Mock).mock.calls[0][1]
      )

      // Check that non-EVM keys are unchanged
      const avalancheKey = storedData.publicKeys.find(
        (pk: PublicKey) => pk.key === 'avalanche-public-key'
      )
      expect(avalancheKey).toEqual(mockPublicKeys[1])

      const solanaKey = storedData.publicKeys.find(
        (pk: PublicKey) => pk.key === 'solana-public-key'
      )
      expect(solanaKey).toEqual(mockPublicKeys[2])
    })

    it('should preserve other wallet data fields', async () => {
      const walletDataWithExtraFields = {
        ...mockWalletData,
        derivationPathSpec: 'BIP44',
        extendedPublicKeys: { 0: { evm: 'xpub123', avalanche: 'xpub456' } }
      }

      mockLoadWalletSecret.mockResolvedValue({
        success: true,
        value: JSON.stringify(walletDataWithExtraFields)
      })

      await BitcoinWalletPolicyService.storeBtcWalletPolicy({
        walletId: mockWalletId,
        publicKeys: mockPublicKeys,
        policyDetails: mockBtcPolicy,
        accountIndex: 0
      })

      const storedData = JSON.parse(
        (mockStoreWalletSecret as jest.Mock).mock.calls[0][1]
      )

      expect(storedData.derivationPathSpec).toBe('BIP44')
      expect(storedData.extendedPublicKeys).toEqual(
        walletDataWithExtraFields.extendedPublicKeys
      )
    })

    it('should return false when loadWalletSecret fails', async () => {
      mockLoadWalletSecret.mockResolvedValue({
        success: false,
        value: ''
      })

      const result = await BitcoinWalletPolicyService.storeBtcWalletPolicy({
        walletId: mockWalletId,
        publicKeys: mockPublicKeys,
        policyDetails: mockBtcPolicy,
        accountIndex: 0
      })

      expect(result).toBe(false)
      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to load wallet secret for Bitcoin policy update'
      )
      expect(mockStoreWalletSecret).not.toHaveBeenCalled()
    })

    it('should return false when storeWalletSecret fails', async () => {
      mockStoreWalletSecret.mockResolvedValue(false)

      const result = await BitcoinWalletPolicyService.storeBtcWalletPolicy({
        walletId: mockWalletId,
        publicKeys: mockPublicKeys,
        policyDetails: mockBtcPolicy,
        accountIndex: 0
      })

      expect(result).toBe(false)
      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to store updated wallet data with Bitcoin policy'
      )
    })

    it('should handle JSON parse errors gracefully', async () => {
      mockLoadWalletSecret.mockResolvedValue({
        success: true,
        value: 'invalid json {'
      })

      const result = await BitcoinWalletPolicyService.storeBtcWalletPolicy({
        walletId: mockWalletId,
        publicKeys: mockPublicKeys,
        policyDetails: mockBtcPolicy,
        accountIndex: 0
      })

      expect(result).toBe(false)
      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to store Bitcoin wallet policy:',
        expect.any(Error)
      )
    })

    it('should handle different account indices correctly', async () => {
      mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/2'/0/0")

      const publicKeysWithAccount2: PublicKey[] = [
        {
          key: 'evm-public-key-account-2',
          derivationPath: "m/44'/60'/2'/0/0",
          curve: Curve.SECP256K1
        }
      ]

      mockLoadWalletSecret.mockResolvedValue({
        success: true,
        value: JSON.stringify({
          deviceId: 'test-device',
          publicKeys: publicKeysWithAccount2
        })
      })

      await BitcoinWalletPolicyService.storeBtcWalletPolicy({
        walletId: mockWalletId,
        publicKeys: publicKeysWithAccount2,
        policyDetails: mockBtcPolicy,
        accountIndex: 2
      })

      expect(mockGetAddressDerivationPath).toHaveBeenCalledWith({
        accountIndex: 2,
        vmType: NetworkVMType.EVM
      })

      const storedData = JSON.parse(
        (mockStoreWalletSecret as jest.Mock).mock.calls[0][1]
      )

      const updatedKey = storedData.publicKeys.find(
        (pk: PublicKey) => pk.derivationPath === "m/44'/60'/2'/0/0"
      )
      expect(updatedKey?.btcWalletPolicy).toEqual(mockBtcPolicy)
    })

    it('should handle unexpected errors during storage', async () => {
      mockLoadWalletSecret.mockRejectedValue(new Error('Network error'))

      const result = await BitcoinWalletPolicyService.storeBtcWalletPolicy({
        walletId: mockWalletId,
        publicKeys: mockPublicKeys,
        policyDetails: mockBtcPolicy,
        accountIndex: 0
      })

      expect(result).toBe(false)
      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to store Bitcoin wallet policy:',
        expect.any(Error)
      )
    })
  })

  describe('needsBtcWalletPolicyRegistration', () => {
    it('should return false when policy exists for account', () => {
      mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/0'/0/0")

      const result =
        BitcoinWalletPolicyService.needsBtcWalletPolicyRegistration(
          mockPublicKeys,
          0
        )

      expect(result).toBe(false)
    })

    it('should return true when policy does not exist for account', () => {
      const publicKeysWithoutPolicy: PublicKey[] = [
        {
          key: 'evm-public-key',
          derivationPath: "m/44'/60'/0'/0/0",
          curve: Curve.SECP256K1
          // No btcWalletPolicy
        }
      ]

      mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/0'/0/0")

      const result =
        BitcoinWalletPolicyService.needsBtcWalletPolicyRegistration(
          publicKeysWithoutPolicy,
          0
        )

      expect(result).toBe(true)
    })

    it('should return true when no matching public key exists', () => {
      mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/99'/0/0")

      const result =
        BitcoinWalletPolicyService.needsBtcWalletPolicyRegistration(
          mockPublicKeys,
          99
        )

      expect(result).toBe(true)
    })

    it('should check correct account index', () => {
      mockGetAddressDerivationPath
        .mockReturnValueOnce("m/44'/60'/0'/0/0") // Account 0 has policy
        .mockReturnValueOnce("m/44'/60'/1'/0/0") // Account 1 doesn't

      const result0 =
        BitcoinWalletPolicyService.needsBtcWalletPolicyRegistration(
          mockPublicKeys,
          0
        )
      const result1 =
        BitcoinWalletPolicyService.needsBtcWalletPolicyRegistration(
          mockPublicKeys,
          1
        )

      expect(result0).toBe(false)
      expect(result1).toBe(true)
    })

    it('should handle empty public keys array', () => {
      const result =
        BitcoinWalletPolicyService.needsBtcWalletPolicyRegistration([], 0)

      expect(result).toBe(true)
    })
  })

  describe('getEvmPublicKey', () => {
    it('should return EVM public key for account 0', () => {
      mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/0'/0/0")

      const result = BitcoinWalletPolicyService.getEvmPublicKey(
        mockPublicKeys,
        0
      )

      expect(mockGetAddressDerivationPath).toHaveBeenCalledWith({
        accountIndex: 0,
        vmType: NetworkVMType.EVM
      })
      expect(result).toEqual({
        key: 'evm-public-key',
        derivationPath: "m/44'/60'/0'/0/0",
        curve: Curve.SECP256K1,
        btcWalletPolicy: mockBtcPolicy
      })
    })

    it('should return EVM public key for different account indices', () => {
      const publicKeysWithAccount1: PublicKey[] = [
        {
          key: 'evm-public-key-account-1',
          derivationPath: "m/44'/60'/1'/0/0",
          curve: Curve.SECP256K1
        }
      ]

      mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/1'/0/0")

      const result = BitcoinWalletPolicyService.getEvmPublicKey(
        publicKeysWithAccount1,
        1
      )

      expect(result?.key).toBe('evm-public-key-account-1')
    })

    it('should return undefined when no matching key found', () => {
      mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/99'/0/0")

      const result = BitcoinWalletPolicyService.getEvmPublicKey(
        mockPublicKeys,
        99
      )

      expect(result).toBeUndefined()
    })

    it('should only match SECP256K1 curve keys', () => {
      const publicKeysWithWrongCurve: PublicKey[] = [
        {
          key: 'ed25519-key',
          derivationPath: "m/44'/60'/0'/0/0",
          curve: Curve.ED25519
        }
      ]

      mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/0'/0/0")

      const result = BitcoinWalletPolicyService.getEvmPublicKey(
        publicKeysWithWrongCurve,
        0
      )

      expect(result).toBeUndefined()
    })

    it('should return key without btcWalletPolicy if not present', () => {
      const publicKeysWithoutPolicy: PublicKey[] = [
        {
          key: 'evm-public-key',
          derivationPath: "m/44'/60'/0'/0/0",
          curve: Curve.SECP256K1
        }
      ]

      mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/0'/0/0")

      const result = BitcoinWalletPolicyService.getEvmPublicKey(
        publicKeysWithoutPolicy,
        0
      )

      expect(result).toEqual({
        key: 'evm-public-key',
        derivationPath: "m/44'/60'/0'/0/0",
        curve: Curve.SECP256K1
      })
    })

    it('should handle empty public keys array', () => {
      const result = BitcoinWalletPolicyService.getEvmPublicKey([], 0)

      expect(result).toBeUndefined()
    })

    it('should handle multiple keys with same curve but different paths', () => {
      const publicKeysWithMultipleSecp: PublicKey[] = [
        {
          key: 'avalanche-key',
          derivationPath: "m/44'/9000'/0'/0/0",
          curve: Curve.SECP256K1
        },
        {
          key: 'evm-key',
          derivationPath: "m/44'/60'/0'/0/0",
          curve: Curve.SECP256K1
        }
      ]

      mockGetAddressDerivationPath.mockReturnValue("m/44'/60'/0'/0/0")

      const result = BitcoinWalletPolicyService.getEvmPublicKey(
        publicKeysWithMultipleSecp,
        0
      )

      expect(result?.key).toBe('evm-key')
      expect(result?.derivationPath).toBe("m/44'/60'/0'/0/0")
    })
  })
})
