import BiometricsSDK from 'utils/BiometricsSDK'
import Keychain from 'react-native-keychain'
import { commonStorage } from 'utils/mmkv'
import { StorageKey } from 'resources/Constants'

// Mock Keychain
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  getAllGenericPasswordServices: jest.fn(),
  ACCESS_CONTROL: {
    BIOMETRY_CURRENT_SET: 'BIOMETRY_CURRENT_SET',
    DEVICE_PASSCODE: 'DEVICE_PASSCODE',
    APPLICATION_PASSWORD: 'APPLICATION_PASSWORD'
  },
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY'
  },
  AUTHENTICATION_TYPE: {
    DEVICE_PASSCODE_OR_BIOMETRICS: 'DEVICE_PASSCODE_OR_BIOMETRICS'
  },
  SECURITY_RULES: {
    NONE: 'NONE'
  }
}))

// Mock commonStorage
jest.mock('utils/mmkv', () => ({
  commonStorage: {
    set: jest.fn(),
    delete: jest.fn()
  }
}))

// Mock keychain result
const keychainResult = {
  service: 'test-service',
  storage: 'keychain'
}

describe('BiometricsSDK', () => {
  const mockWalletId = 'test-wallet-1'
  const mockEncryptedKey = 'encrypted-key'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('storeWalletWithPin', () => {
    it('should store wallet with PIN successfully', async () => {
      ;(Keychain.setGenericPassword as jest.Mock).mockResolvedValue(
        keychainResult
      )

      const result = await BiometricsSDK.storeWalletWithPin(
        mockWalletId,
        mockEncryptedKey,
        false
      )

      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        mockWalletId,
        mockEncryptedKey,
        expect.objectContaining({
          service: expect.stringContaining(mockWalletId)
        })
      )
      expect(commonStorage.set).toHaveBeenCalledWith(
        StorageKey.SECURE_ACCESS_SET,
        'PIN'
      )
      expect(result).toBe(keychainResult)
    })

    it('should not set secure access when resetting', async () => {
      ;(Keychain.setGenericPassword as jest.Mock).mockResolvedValue(
        keychainResult
      )

      await BiometricsSDK.storeWalletWithPin(
        mockWalletId,
        mockEncryptedKey,
        true
      )

      expect(commonStorage.set).not.toHaveBeenCalled()
    })
  })

  describe('loadWalletWithPin', () => {
    it('should load wallet with PIN successfully', async () => {
      const mockCredentials = {
        ...keychainResult,
        username: mockWalletId,
        password: mockEncryptedKey
      }
      ;(Keychain.getGenericPassword as jest.Mock).mockResolvedValue(
        mockCredentials
      )

      const result = await BiometricsSDK.loadWalletWithPin(mockWalletId)

      expect(Keychain.getGenericPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          service: expect.stringContaining(mockWalletId)
        })
      )
      expect(result).toEqual(mockCredentials)
    })
  })

  describe('storeWalletWithBiometry', () => {
    it('should store wallet with biometry successfully', async () => {
      ;(Keychain.setGenericPassword as jest.Mock).mockResolvedValue(
        keychainResult
      )

      const result = await BiometricsSDK.storeWalletWithBiometry(
        mockWalletId,
        mockEncryptedKey
      )

      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        mockWalletId,
        mockEncryptedKey,
        expect.objectContaining({
          service: expect.stringContaining(mockWalletId)
        })
      )
      expect(commonStorage.set).toHaveBeenCalledWith(
        StorageKey.SECURE_ACCESS_SET,
        'BIO'
      )
      expect(result).toBe(true)
    })

    it('should fallback to device code when biometry fails', async () => {
      ;(Keychain.setGenericPassword as jest.Mock)
        .mockRejectedValueOnce(new Error('Biometry failed'))
        .mockResolvedValueOnce(keychainResult)

      const result = await BiometricsSDK.storeWalletWithBiometry(
        mockWalletId,
        mockEncryptedKey
      )

      expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(2)
      expect(result).toBe(true)
    })
  })

  describe('clearAllWalletKeys', () => {
    it('should clear all wallet keys successfully', async () => {
      const mockServices = ['service1', 'service2']
      ;(Keychain.getAllGenericPasswordServices as jest.Mock).mockResolvedValue(
        mockServices
      )
      ;(Keychain.resetGenericPassword as jest.Mock).mockResolvedValue(true)

      await BiometricsSDK.clearAllWalletKeys()

      expect(Keychain.getAllGenericPasswordServices).toHaveBeenCalled()
      expect(Keychain.resetGenericPassword).toHaveBeenCalledTimes(2)
      expect(commonStorage.delete).toHaveBeenCalledWith(
        StorageKey.SECURE_ACCESS_SET
      )
    })
  })
})
