import KeychainMigrator from './KeychainMigrator'
import BiometricsSDK from './BiometricsSDK'
import Logger from './Logger'

jest.mock('./BiometricsSDK')
jest.mock('./Logger')

const mockBiometricsSDK = BiometricsSDK as jest.Mocked<typeof BiometricsSDK>
const mockLogger = Logger as jest.Mocked<typeof Logger>

describe('KeychainMigrator', () => {
  const activeWalletId = 'test-wallet'
  let keychainMigrator: KeychainMigrator

  beforeEach(() => {
    jest.clearAllMocks()
    keychainMigrator = new KeychainMigrator(activeWalletId)
  })

  describe('getMigrationStatus', () => {
    it('should return false if fully migrated', async () => {
      mockBiometricsSDK.hasEncryptionKeyWithPin.mockResolvedValue(true)
      const status = await keychainMigrator.getMigrationStatus('PIN')
      expect(status).toBe(false)
    })

    it('should return "completePartialMigration" if bio key exists but pin key does not', async () => {
      mockBiometricsSDK.hasEncryptionKeyWithPin.mockResolvedValue(false)
      mockBiometricsSDK.hasEncryptionKeyWithBiometry.mockResolvedValue(true)
      const status = await keychainMigrator.getMigrationStatus('PIN')
      expect(status).toBe('completePartialMigration')
    })

    it('should return "runPinMigration" if no keys exist and access type is PIN', async () => {
      mockBiometricsSDK.hasEncryptionKeyWithPin.mockResolvedValue(false)
      mockBiometricsSDK.hasEncryptionKeyWithBiometry.mockResolvedValue(false)
      const status = await keychainMigrator.getMigrationStatus('PIN')
      expect(status).toBe('runPinMigration')
    })

    it('should return "runBiometricMigration" if no keys exist and access type is Biometric', async () => {
      mockBiometricsSDK.hasEncryptionKeyWithPin.mockResolvedValue(false)
      mockBiometricsSDK.hasEncryptionKeyWithBiometry.mockResolvedValue(false)
      const status = await keychainMigrator.getMigrationStatus('BIO')
      expect(status).toBe('runBiometricMigration')
    })
  })

  describe('runPinMigration', () => {
    const pin = '123456'
    const mnemonic = 'test-mnemonic'
    const newEncryptionKey = 'new-key'

    it('should successfully migrate with PIN', async () => {
      mockBiometricsSDK.loadLegacyWalletWithPin.mockResolvedValue(mnemonic)
      mockBiometricsSDK.generateEncryptionKey.mockResolvedValue(
        newEncryptionKey
      )
      mockBiometricsSDK.getAccessType.mockReturnValue('PIN')

      const result = await keychainMigrator.runPinMigration(pin)

      expect(mockBiometricsSDK.loadLegacyWalletWithPin).toHaveBeenCalledWith(
        pin
      )
      expect(mockBiometricsSDK.storeEncryptionKeyWithPin).toHaveBeenCalledWith(
        newEncryptionKey,
        pin
      )
      expect(
        mockBiometricsSDK.storeEncryptionKeyWithBiometry
      ).not.toHaveBeenCalled()
      expect(mockBiometricsSDK.loadEncryptionKeyWithPin).toHaveBeenCalledWith(
        pin
      )
      expect(mockBiometricsSDK.storeWalletSecret).toHaveBeenCalledWith(
        activeWalletId,
        mnemonic
      )
      expect(mockBiometricsSDK.clearLegacyWalletData).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should successfully migrate with PIN and store biometry key if enabled', async () => {
      mockBiometricsSDK.loadLegacyWalletWithPin.mockResolvedValue(mnemonic)
      mockBiometricsSDK.generateEncryptionKey.mockResolvedValue(
        newEncryptionKey
      )
      mockBiometricsSDK.getAccessType.mockReturnValue('BIO')

      const result = await keychainMigrator.runPinMigration(pin)

      expect(
        mockBiometricsSDK.storeEncryptionKeyWithBiometry
      ).toHaveBeenCalledWith(newEncryptionKey)
      expect(result).toBe(true)
    })

    it('should return false if loading legacy wallet fails', async () => {
      mockBiometricsSDK.loadLegacyWalletWithPin.mockResolvedValue(false)
      const result = await keychainMigrator.runPinMigration(pin)
      expect(result).toBe(false)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'PIN-based keychain migration failed:',
        new Error('Could not load legacy wallet with PIN')
      )
    })

    it('should return false on error', async () => {
      mockBiometricsSDK.loadLegacyWalletWithPin.mockRejectedValue(
        new Error('test error')
      )
      const result = await keychainMigrator.runPinMigration(pin)
      expect(result).toBe(false)
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('runBiometricMigration', () => {
    const mnemonic = 'test-mnemonic'
    const newEncryptionKey = 'new-key'
    it('should successfully run partial biometric migration', async () => {
      mockBiometricsSDK.loadLegacyWalletWithBiometry.mockResolvedValue(mnemonic)
      mockBiometricsSDK.generateEncryptionKey.mockResolvedValue(
        newEncryptionKey
      )

      const result = await keychainMigrator.runBiometricMigration()

      expect(mockBiometricsSDK.loadLegacyWalletWithBiometry).toHaveBeenCalled()
      expect(
        mockBiometricsSDK.storeEncryptionKeyWithBiometry
      ).toHaveBeenCalledWith(newEncryptionKey)
      expect(mockBiometricsSDK.storeWalletSecret).toHaveBeenCalledWith(
        activeWalletId,
        mnemonic
      )
      expect(mockBiometricsSDK.clearLegacyWalletData).not.toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return false if loading legacy wallet fails', async () => {
      mockBiometricsSDK.loadLegacyWalletWithBiometry.mockResolvedValue(false)
      const result = await keychainMigrator.runBiometricMigration()
      expect(result).toBe(false)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Biometric-based keychain migration failed:',
        new Error('Could not load legacy wallet with biometrics.')
      )
    })

    it('should return false on error', async () => {
      mockBiometricsSDK.loadLegacyWalletWithBiometry.mockRejectedValue(
        new Error('test error')
      )
      const result = await keychainMigrator.runBiometricMigration()
      expect(result).toBe(false)
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('completePartialMigration', () => {
    const pin = '123456'
    const mnemonic = 'test-mnemonic'
    const newEncryptionKey = 'new-key'

    it('should successfully complete a partial migration', async () => {
      mockBiometricsSDK.loadLegacyWalletWithPin.mockResolvedValue(mnemonic)
      mockBiometricsSDK.generateEncryptionKey.mockResolvedValue(
        newEncryptionKey
      )
      const result = await keychainMigrator.completePartialMigration(pin)

      expect(mockBiometricsSDK.loadLegacyWalletWithPin).toHaveBeenCalledWith(
        pin
      )
      expect(mockBiometricsSDK.generateEncryptionKey).toHaveBeenCalled()
      expect(mockBiometricsSDK.storeEncryptionKeyWithPin).toHaveBeenCalledWith(
        newEncryptionKey,
        pin
      )
      expect(
        mockBiometricsSDK.storeEncryptionKeyWithBiometry
      ).toHaveBeenCalledWith(newEncryptionKey)
      expect(mockBiometricsSDK.storeWalletSecret).toHaveBeenCalledWith(
        activeWalletId,
        mnemonic
      )
      expect(mockBiometricsSDK.clearLegacyWalletData).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return false if loading legacy wallet fails', async () => {
      mockBiometricsSDK.loadLegacyWalletWithPin.mockResolvedValue(false)
      const result = await keychainMigrator.completePartialMigration(pin)
      expect(result).toBe(false)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to complete partial migration:',
        new Error('Could not load legacy wallet with PIN.')
      )
    })

    it('should return false on error', async () => {
      mockBiometricsSDK.loadLegacyWalletWithPin.mockRejectedValue(
        new Error('test error')
      )
      const result = await keychainMigrator.completePartialMigration(pin)
      expect(result).toBe(false)
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })
})
