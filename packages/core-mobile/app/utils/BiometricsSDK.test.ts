import BiometricsSDK, {
  bioGetOptions,
  BiometricType,
  bioSetOptions,
  ENCRYPTION_KEY_SERVICE,
  ENCRYPTION_KEY_SERVICE_BIO,
  passcodeGetOptions,
  passcodeSetOptions,
  walletSecretOptions
} from 'utils/BiometricsSDK'
import Keychain, { BIOMETRY_TYPE } from 'react-native-keychain'
import { commonStorage } from 'utils/mmkv'
import { StorageKey } from 'resources/Constants'
import { decrypt, encrypt } from 'utils/EncryptionHelper'
import Logger from 'utils/Logger'

// Mock dependencies
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  getAllGenericPasswordServices: jest.fn(),
  getSupportedBiometryType: jest.fn(),
  ACCESS_CONTROL: {
    BIOMETRY_CURRENT_SET: 'BIOMETRY_CURRENT_SET',
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
  },
  BIOMETRY_TYPE: {
    FACE: 'FACE',
    FACE_ID: 'FACE_ID',
    TOUCH_ID: 'TOUCH_ID',
    FINGERPRINT: 'FINGERPRINT',
    IRIS: 'IRIS'
  }
}))

jest.mock('utils/mmkv', () => ({
  commonStorage: {
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn()
  }
}))

jest.mock('utils/EncryptionHelper', () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn()
}))

jest.mock('react-native-aes-crypto', () => ({
  randomKey: jest.fn()
}))

jest.mock('utils/Logger', () => ({
  error: jest.fn()
}))

// Cast mocks for type safety
const mockKeychain = Keychain as jest.Mocked<typeof Keychain>
const mockCommonStorage = commonStorage as jest.Mocked<typeof commonStorage>
const mockEncrypt = encrypt as jest.Mock
const mockDecrypt = decrypt as jest.Mock
const mockLogger = Logger as jest.Mocked<typeof Logger>

enum STORAGE_TYPE {
  AES_CBC = 'KeystoreAESCBC',
  AES_GCM_NO_AUTH = 'KeystoreAESGCM_NoAuth',
  AES_GCM = 'KeystoreAESGCM',
  RSA = 'KeystoreRSAECB'
}

describe('BiometricsSDK', () => {
  const mockPin = '123456'
  const mockEncryptionKey = 'mock-encryption-key'
  const mockEncryptedData = 'mock-encrypted-data'
  const mockWalletId = 'test-wallet-1'
  const mockSecret = 'super-secret-phrase'
  const mockKeychainResult = {
    service: 'some-service',
    username: 'encryptionKey',
    password: mockEncryptedData,
    storage: STORAGE_TYPE.AES_GCM
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    BiometricsSDK.clearEncryptionKey()
  })

  describe('Encryption Key Management', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should store encryption key with PIN', async () => {
      mockEncrypt.mockResolvedValue(mockEncryptedData)
      mockKeychain.setGenericPassword.mockResolvedValue(mockKeychainResult)

      const result = await BiometricsSDK.storeEncryptionKeyWithPin(
        mockEncryptionKey,
        mockPin
      )

      expect(mockCommonStorage.set).toHaveBeenCalledWith(
        StorageKey.SECURE_ACCESS_SET,
        'PIN'
      )
      expect(mockEncrypt).toHaveBeenCalledWith(mockEncryptionKey, mockPin)
      expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith(
        'encryptionKey',
        mockEncryptedData,
        passcodeSetOptions
      )
      expect(result).toBe(true)
    })

    it('should store encryption key with biometry', async () => {
      mockKeychain.setGenericPassword.mockResolvedValue(mockKeychainResult)

      const result = await BiometricsSDK.storeEncryptionKeyWithBiometry(
        mockEncryptionKey
      )

      expect(mockCommonStorage.set).toHaveBeenCalledWith(
        StorageKey.SECURE_ACCESS_SET,
        'BIO'
      )
      expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith(
        'encryptionKey',
        mockEncryptionKey,
        bioSetOptions
      )
      expect(result).toBe(true)
    })

    it('should handle failure when storing with biometry', async () => {
      mockKeychain.setGenericPassword.mockRejectedValue(new Error('Bio failed'))

      const result = await BiometricsSDK.storeEncryptionKeyWithBiometry(
        mockEncryptionKey
      )

      expect(result).toBe(false)
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should load encryption key with PIN', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue({
        ...mockKeychainResult,
        password: mockEncryptedData
      })
      mockDecrypt.mockResolvedValue({
        data: mockEncryptionKey,
        iv: '',
        tag: ''
      })

      const result = await BiometricsSDK.loadEncryptionKeyWithPin(mockPin)

      expect(mockKeychain.getGenericPassword).toHaveBeenCalledWith(
        passcodeGetOptions
      )
      expect(mockDecrypt).toHaveBeenCalledWith(mockEncryptedData, mockPin)
      expect(result).toBe(true)
    })

    it('should return false if loading with PIN fails at decryption', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue({
        ...mockKeychainResult,
        password: mockEncryptedData
      })
      mockDecrypt.mockResolvedValue(false)

      const result = await BiometricsSDK.loadEncryptionKeyWithPin(mockPin)

      expect(result).toBe(false)
    })

    it('should return false if no credentials found for PIN', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue(false)
      const result = await BiometricsSDK.loadEncryptionKeyWithPin(mockPin)
      expect(result).toBe(false)
    })

    it('should load encryption key with biometry', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue({
        ...mockKeychainResult,
        password: mockEncryptionKey
      })

      const result = await BiometricsSDK.loadEncryptionKeyWithBiometry()

      expect(mockKeychain.getGenericPassword).toHaveBeenCalledWith(
        bioGetOptions
      )
      expect(result).toBe(true)
    })

    it('should return false if no credentials for biometry', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue(false)
      const result = await BiometricsSDK.loadEncryptionKeyWithBiometry()
      expect(result).toBe(false)
    })

    it('should change PIN', async () => {
      const newPin = '654321'
      mockEncrypt.mockResolvedValue('new-encrypted-data')
      mockKeychain.setGenericPassword.mockResolvedValue(mockKeychainResult)

      // first load key into cache
      await BiometricsSDK.storeEncryptionKeyWithPin(mockEncryptionKey, 'oldPin')
      await BiometricsSDK.changePin(newPin)

      expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: passcodeGetOptions.service
      })
      // Legacy service is also called
      expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: 'sec-storage-service'
      })
      expect(mockEncrypt).toHaveBeenCalledWith(mockEncryptionKey, newPin)
      expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith(
        'encryptionKey',
        'new-encrypted-data',
        passcodeSetOptions
      )
    })

    it('should throw error when changing PIN without key in cache', async () => {
      await expect(BiometricsSDK.changePin('newPin')).rejects.toThrow(
        'Encryption key not found'
      )
    })
  })

  describe('Wallet Secret Management', () => {
    beforeEach(async () => {
      // Pre-load encryption key for these tests
      mockKeychain.getGenericPassword.mockResolvedValue({
        ...mockKeychainResult,
        password: mockEncryptionKey
      })
      await BiometricsSDK.loadEncryptionKeyWithBiometry()
      jest.clearAllMocks() // Clear mocks after setup
    })

    it('should store wallet secret', async () => {
      mockEncrypt.mockResolvedValue(mockEncryptedData)
      mockKeychain.setGenericPassword.mockResolvedValue(mockKeychainResult)

      await BiometricsSDK.storeWalletSecret(mockWalletId, mockSecret)

      expect(mockEncrypt).toHaveBeenCalledWith(mockSecret, mockEncryptionKey)
      expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith(
        'walletSecret',
        mockEncryptedData,
        walletSecretOptions(mockWalletId)
      )
    })

    it('should throw error when storing secret without key in cache', async () => {
      BiometricsSDK.clearEncryptionKey() // empty cache
      await expect(
        BiometricsSDK.storeWalletSecret(mockWalletId, mockSecret)
      ).rejects.toThrow('Encryption key not found')
    })

    it('should load wallet secret', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue({
        ...mockKeychainResult,
        password: mockEncryptedData
      })
      mockDecrypt.mockResolvedValue({ data: mockSecret, iv: '', tag: '' })

      const result = await BiometricsSDK.loadWalletSecret(mockWalletId)

      expect(mockKeychain.getGenericPassword).toHaveBeenCalledWith(
        walletSecretOptions(mockWalletId)
      )
      expect(mockDecrypt).toHaveBeenCalledWith(
        mockEncryptedData,
        mockEncryptionKey
      )
      expect(result).toEqual({
        success: true,
        value: mockSecret
      })
    })

    it('should return error when loading secret without key in cache', async () => {
      BiometricsSDK.clearEncryptionKey() // empty cache
      const result = await BiometricsSDK.loadWalletSecret(mockWalletId)
      expect(result).toEqual({
        error: new Error('Encryption key not found'),
        success: false
      })
    })

    it('should return false if loading wallet secret fails', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue(false)
      const result = await BiometricsSDK.loadWalletSecret(mockWalletId)
      expect(result).toEqual({
        error: new Error('No credentials found'),
        success: false
      })
    })
  })

  describe('Data Clearing', () => {
    it('should clear wallet data', async () => {
      await BiometricsSDK.clearWalletData(mockWalletId)
      expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith(
        walletSecretOptions(mockWalletId)
      )
    })

    it('should clear all relevant data', async () => {
      const LEGACY_SERVICE_KEY_BIO = 'sec-storage-service-bio'
      const LEGACY_SERVICE_KEY = 'sec-storage-service'
      const mockServices = [
        `sec-storage-service-${mockWalletId}`,
        'sec-storage-service-wallet2',
        ENCRYPTION_KEY_SERVICE,
        ENCRYPTION_KEY_SERVICE_BIO,
        'some-other-service' // This one should be ignored
      ]
      mockKeychain.getAllGenericPasswordServices.mockResolvedValue(mockServices)

      await BiometricsSDK.clearAllData()

      expect(mockKeychain.getAllGenericPasswordServices).toHaveBeenCalled()
      expect(mockKeychain.resetGenericPassword).toHaveBeenCalledTimes(6)
      expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: `sec-storage-service-${mockWalletId}`
      })
      expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: 'sec-storage-service-wallet2'
      })
      expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: ENCRYPTION_KEY_SERVICE
      })
      expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: ENCRYPTION_KEY_SERVICE_BIO
      })
      expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: LEGACY_SERVICE_KEY
      })
      expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: LEGACY_SERVICE_KEY_BIO
      })
      expect(mockKeychain.resetGenericPassword).not.toHaveBeenCalledWith({
        service: 'some-other-service'
      })
      expect(mockCommonStorage.delete).toHaveBeenCalledWith(
        StorageKey.SECURE_ACCESS_SET
      )
    })

    it('should disable biometry', async () => {
      await BiometricsSDK.disableBiometry()

      expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: bioGetOptions.service
      })
      expect(mockCommonStorage.set).toHaveBeenCalledWith(
        StorageKey.SECURE_ACCESS_SET,
        'PIN'
      )
    })
  })

  describe('Utility/Biometry Info', () => {
    it('should get access type', () => {
      mockCommonStorage.getString.mockReturnValue('BIO')
      expect(BiometricsSDK.getAccessType()).toBe('BIO')

      mockCommonStorage.getString.mockReturnValue('PIN')
      expect(BiometricsSDK.getAccessType()).toBe('PIN')

      mockCommonStorage.getString.mockReturnValue(undefined)
      expect(BiometricsSDK.getAccessType()).toBe('PIN') // default
    })

    it('should check if biometry can be used', async () => {
      mockKeychain.getSupportedBiometryType.mockResolvedValue(
        BIOMETRY_TYPE.FACE_ID
      )
      const result = await BiometricsSDK.canUseBiometry()
      expect(result).toBe(true)

      mockKeychain.getSupportedBiometryType.mockResolvedValue(null)
      const secondResult = await BiometricsSDK.canUseBiometry()
      expect(secondResult).toBe(false)
    })

    it('should get biometry type', async () => {
      mockKeychain.getSupportedBiometryType.mockResolvedValue(
        BIOMETRY_TYPE.FACE_ID
      )
      expect(await BiometricsSDK.getBiometryType()).toBe(BiometricType.FACE_ID)

      mockKeychain.getSupportedBiometryType.mockResolvedValue(
        BIOMETRY_TYPE.TOUCH_ID
      )
      expect(await BiometricsSDK.getBiometryType()).toBe(BiometricType.TOUCH_ID)

      mockKeychain.getSupportedBiometryType.mockResolvedValue(
        BIOMETRY_TYPE.IRIS
      )
      expect(await BiometricsSDK.getBiometryType()).toBe(BiometricType.IRIS)

      mockKeychain.getSupportedBiometryType.mockResolvedValue(null)
      expect(await BiometricsSDK.getBiometryType()).toBe(BiometricType.NONE)
    })

    it('should warmup', async () => {
      await BiometricsSDK.warmup()
      expect(mockKeychain.getAllGenericPasswordServices).toHaveBeenCalled()
    })
  })

  describe('Legacy Methods', () => {
    const legacyPin = 'old-pin'
    const legacyEncryptedPassword = 'legacy-encrypted-password'
    const legacyDecryptedData = 'legacy-decrypted-data'
    const LEGACY_SERVICE_KEY_BIO = 'sec-storage-service-bio'
    const LEGACY_SERVICE_KEY = 'sec-storage-service'

    it('should load legacy wallet with pin', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue({
        ...mockKeychainResult,
        password: legacyEncryptedPassword
      })
      mockDecrypt.mockResolvedValue({ data: legacyDecryptedData })

      const result = await BiometricsSDK.loadLegacyWalletWithPin(legacyPin)

      expect(mockKeychain.getGenericPassword).toHaveBeenCalledWith({
        service: LEGACY_SERVICE_KEY_BIO
      })
      expect(mockDecrypt).toHaveBeenCalledWith(
        legacyEncryptedPassword,
        legacyPin
      )
      expect(result).toEqual({
        success: true,
        value: legacyDecryptedData
      })
    })

    it('should return false if legacy wallet with pin fails decryption', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue({
        ...mockKeychainResult,
        password: legacyEncryptedPassword
      })
      mockDecrypt.mockResolvedValue(false)
      const result = await BiometricsSDK.loadLegacyWalletWithPin(legacyPin)
      expect(result).toEqual({
        error: new Error('Failed to decrypt'),
        success: false
      })
    })

    it('should return false if no credentials for legacy wallet with pin', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue(false)
      const result = await BiometricsSDK.loadLegacyWalletWithPin(legacyPin)
      expect(result).toEqual({
        error: new Error('No credentials found'),
        success: false
      })
    })

    it('should load legacy wallet with biometry', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue({
        ...mockKeychainResult,
        password: legacyDecryptedData
      })

      const result = await BiometricsSDK.loadLegacyWalletWithBiometry()

      expect(mockKeychain.getGenericPassword).toHaveBeenCalledWith(
        expect.objectContaining({ service: LEGACY_SERVICE_KEY })
      )
      expect(result).toEqual({
        success: true,
        value: legacyDecryptedData
      })
    })

    it('should return false if no credentials for legacy wallet with biometry', async () => {
      mockKeychain.getGenericPassword.mockResolvedValue(false)
      const result = await BiometricsSDK.loadLegacyWalletWithBiometry()
      expect(result).toEqual({
        error: new Error('No credentials found'),
        success: false
      })
    })

    it('should clear legacy wallet data', async () => {
      await BiometricsSDK.clearLegacyWalletData()
      expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: LEGACY_SERVICE_KEY
      })
      expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: LEGACY_SERVICE_KEY_BIO
      })
    })
  })
})
