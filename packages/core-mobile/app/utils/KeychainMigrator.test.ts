import KeychainMigrator, {
  BadPinError,
  MigrationFailedError
} from './KeychainMigrator'
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

  describe('migrateIfNeeded', () => {
    const pin = '123456'

    it('should return early if no migration is needed', async () => {
      mockBiometricsSDK.hasEncryptionKeyWithPin.mockResolvedValue(true)

      await keychainMigrator.migrateIfNeeded('PIN', pin)

      expect(mockBiometricsSDK.loadLegacyWalletWithPin).not.toHaveBeenCalled()
    })

    it('should run pin migration when needed', async () => {
      mockBiometricsSDK.hasEncryptionKeyWithPin.mockResolvedValue(false)
      mockBiometricsSDK.hasEncryptionKeyWithBiometry.mockResolvedValue(false)
      mockBiometricsSDK.loadLegacyWalletWithPin.mockResolvedValue({
        success: true,
        value: 'test-mnemonic'
      })
      mockBiometricsSDK.generateEncryptionKey.mockResolvedValue('new-key')
      mockBiometricsSDK.getAccessType.mockReturnValue('PIN')
      mockBiometricsSDK.isPinCorrect.mockResolvedValue(true)

      await keychainMigrator.migrateIfNeeded('PIN', pin)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Migration needed:',
        'runPinMigration'
      )
      expect(mockBiometricsSDK.loadLegacyWalletWithPin).toHaveBeenCalledWith(
        pin
      )
    })

    it('should run biometric migration when needed', async () => {
      mockBiometricsSDK.hasEncryptionKeyWithPin.mockResolvedValue(false)
      mockBiometricsSDK.hasEncryptionKeyWithBiometry.mockResolvedValue(false)
      mockBiometricsSDK.loadLegacyWalletWithBiometry.mockResolvedValue({
        success: true,
        value: 'test-mnemonic'
      })
      mockBiometricsSDK.generateEncryptionKey.mockResolvedValue('new-key')

      await keychainMigrator.migrateIfNeeded('BIO')

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Migration needed:',
        'runBiometricMigration'
      )
      expect(mockBiometricsSDK.loadLegacyWalletWithBiometry).toHaveBeenCalled()
    })

    it('should complete partial migration when needed', async () => {
      mockBiometricsSDK.hasEncryptionKeyWithPin.mockResolvedValue(false)
      mockBiometricsSDK.hasEncryptionKeyWithBiometry.mockResolvedValue(true)
      mockBiometricsSDK.loadLegacyWalletWithPin.mockResolvedValue({
        success: true,
        value: 'test-mnemonic'
      })
      mockBiometricsSDK.generateEncryptionKey.mockResolvedValue('new-key')
      mockBiometricsSDK.isPinCorrect.mockResolvedValue(true)

      await keychainMigrator.migrateIfNeeded('PIN', pin)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Migration needed:',
        'completePartialMigration'
      )
      expect(mockBiometricsSDK.loadLegacyWalletWithPin).toHaveBeenCalledWith(
        pin
      )
    })

    it('should throw BadPinError if PIN is required but not provided', async () => {
      mockBiometricsSDK.hasEncryptionKeyWithPin.mockResolvedValue(false)
      mockBiometricsSDK.hasEncryptionKeyWithBiometry.mockResolvedValue(false)

      await expect(keychainMigrator.migrateIfNeeded('PIN')).rejects.toThrow(
        BadPinError
      )
    })

    it('should throw MigrationFailedError on unexpected migration status for biometric', async () => {
      mockBiometricsSDK.hasEncryptionKeyWithPin.mockResolvedValue(false)
      mockBiometricsSDK.hasEncryptionKeyWithBiometry.mockResolvedValue(true)

      await expect(keychainMigrator.migrateIfNeeded('BIO')).rejects.toThrow(
        MigrationFailedError
      )
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unexpected migration status:',
        'completePartialMigration'
      )
    })

    it('should throw MigrationFailedError when underlying migration fails', async () => {
      mockBiometricsSDK.hasEncryptionKeyWithPin.mockResolvedValue(false)
      mockBiometricsSDK.hasEncryptionKeyWithBiometry.mockResolvedValue(false)
      mockBiometricsSDK.loadLegacyWalletWithPin.mockResolvedValue({
        success: false,
        error: new Error('Load failed')
      })
      mockBiometricsSDK.isPinCorrect.mockResolvedValue(true)

      await expect(
        keychainMigrator.migrateIfNeeded('PIN', pin)
      ).rejects.toThrow(MigrationFailedError)
    })
  })

  describe('runPinMigration', () => {
    const pin = '123456'
    const mnemonic = 'test-mnemonic'
    const newEncryptionKey = 'new-key'

    it('should successfully migrate with PIN', async () => {
      mockBiometricsSDK.loadLegacyWalletWithPin.mockResolvedValue({
        success: true,
        value: mnemonic
      })
      mockBiometricsSDK.generateEncryptionKey.mockResolvedValue(
        newEncryptionKey
      )
      mockBiometricsSDK.getAccessType.mockReturnValue('PIN')

      await keychainMigrator.runPinMigration(pin)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting PIN-based keychain migration.'
      )
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
      expect(mockLogger.info).toHaveBeenCalledWith(
        'PIN-based keychain migration completed successfully.'
      )
    })

    it('should successfully migrate with PIN and store biometry key if enabled', async () => {
      mockBiometricsSDK.loadLegacyWalletWithPin.mockResolvedValue({
        success: true,
        value: mnemonic
      })
      mockBiometricsSDK.generateEncryptionKey.mockResolvedValue(
        newEncryptionKey
      )
      mockBiometricsSDK.getAccessType.mockReturnValue('BIO')

      await keychainMigrator.runPinMigration(pin)

      expect(
        mockBiometricsSDK.storeEncryptionKeyWithBiometry
      ).toHaveBeenCalledWith(newEncryptionKey)
    })

    it('should throw error if loading legacy wallet fails', async () => {
      const error = new Error('Could not load legacy wallet with PIN')
      mockBiometricsSDK.loadLegacyWalletWithPin.mockResolvedValue({
        success: false,
        error
      })

      await expect(keychainMigrator.runPinMigration(pin)).rejects.toThrow(error)
    })

    it('should throw error on exception', async () => {
      const error = new Error('test error')
      mockBiometricsSDK.loadLegacyWalletWithPin.mockRejectedValue(error)

      await expect(keychainMigrator.runPinMigration(pin)).rejects.toThrow(error)
    })
  })

  describe('runBiometricMigration', () => {
    const mnemonic = 'test-mnemonic'
    const newEncryptionKey = 'new-key'

    it('should successfully run partial biometric migration', async () => {
      mockBiometricsSDK.loadLegacyWalletWithBiometry.mockResolvedValue({
        success: true,
        value: mnemonic
      })
      mockBiometricsSDK.generateEncryptionKey.mockResolvedValue(
        newEncryptionKey
      )

      await keychainMigrator.runBiometricMigration()

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting biometric-based keychain migration.'
      )
      expect(mockBiometricsSDK.loadLegacyWalletWithBiometry).toHaveBeenCalled()
      expect(
        mockBiometricsSDK.storeEncryptionKeyWithBiometry
      ).toHaveBeenCalledWith(newEncryptionKey)
      expect(mockBiometricsSDK.storeWalletSecret).toHaveBeenCalledWith(
        activeWalletId,
        mnemonic
      )
      expect(mockBiometricsSDK.clearLegacyWalletData).not.toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Biometric-based keychain migration (partial) completed successfully.'
      )
    })

    it('should throw error if loading legacy wallet fails', async () => {
      const error = new Error('Could not load legacy wallet with biometrics.')
      mockBiometricsSDK.loadLegacyWalletWithBiometry.mockResolvedValue({
        success: false,
        error
      })

      await expect(keychainMigrator.runBiometricMigration()).rejects.toThrow(
        error
      )
    })

    it('should throw error on exception', async () => {
      const error = new Error('test error')
      mockBiometricsSDK.loadLegacyWalletWithBiometry.mockRejectedValue(error)

      await expect(keychainMigrator.runBiometricMigration()).rejects.toThrow(
        error
      )
    })
  })

  describe('completePartialMigration', () => {
    const pin = '123456'
    const mnemonic = 'test-mnemonic'
    const newEncryptionKey = 'new-key'

    it('should successfully complete a partial migration', async () => {
      mockBiometricsSDK.loadLegacyWalletWithPin.mockResolvedValue({
        success: true,
        value: mnemonic
      })
      mockBiometricsSDK.generateEncryptionKey.mockResolvedValue(
        newEncryptionKey
      )

      await keychainMigrator.completePartialMigration(pin)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting completion of partial migration.'
      )
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
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Partial keychain migration completed successfully.'
      )
    })

    it('should throw error if loading legacy wallet fails', async () => {
      const error = new Error('Could not load legacy wallet with PIN.')
      mockBiometricsSDK.loadLegacyWalletWithPin.mockResolvedValue({
        success: false,
        error
      })

      await expect(
        keychainMigrator.completePartialMigration(pin)
      ).rejects.toThrow(error)
    })

    it('should throw error on exception', async () => {
      const error = new Error('test error')
      mockBiometricsSDK.loadLegacyWalletWithPin.mockRejectedValue(error)

      await expect(
        keychainMigrator.completePartialMigration(pin)
      ).rejects.toThrow(error)
    })
  })
})
