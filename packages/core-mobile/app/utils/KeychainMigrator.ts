import BiometricsSDK from './BiometricsSDK'
import Logger from './Logger'

class KeychainMigrator {
  private activeWalletId: string

  constructor(activeWalletId: string) {
    this.activeWalletId = activeWalletId
    Logger.info('KeychainMigrator initialized for wallet:', activeWalletId)
  }

  public async getMigrationStatus(
    accessType: 'PIN' | 'BIO'
  ): Promise<
    | 'runPinMigration'
    | 'runBiometricMigration'
    | 'completePartialMigration'
    | false
  > {
    // Check for legacy wallet data with both PIN and biometrics
    const newPinKeyExists = await BiometricsSDK.getEncryptionKeyWithPinExists()
    const newBioKeyExists =
      await BiometricsSDK.getEncryptionKeyWithBiometryExists()

    //fully migrated
    if (newPinKeyExists) {
      return false
    }

    // no pin key, but bio key exists
    if (newBioKeyExists) {
      return 'completePartialMigration'
    }

    //no keys exist
    return accessType === 'PIN' ? 'runPinMigration' : 'runBiometricMigration'
  }

  // Path 1: User logs in with PIN
  public async runPinMigration(pin: string): Promise<boolean> {
    try {
      Logger.info('Starting PIN-based keychain migration.')

      const mnemonic = await BiometricsSDK.loadLegacyWalletWithPin(pin)
      Logger.info('mnemonic', mnemonic)
      if (!mnemonic) {
        Logger.error('Could not load legacy wallet with PIN')
        return false
      }
      const newEncryptionKey = await BiometricsSDK.generateEncryptionKey()

      // Store new encryption key for both PIN and Biometry
      await BiometricsSDK.storeEncryptionKeyWithPin(newEncryptionKey, pin)

      const accessType = BiometricsSDK.getAccessType()
      if (accessType === 'BIO') {
        await BiometricsSDK.storeEncryptionKeyWithBiometry(newEncryptionKey)
      }
      await BiometricsSDK.loadEncryptionKeyWithPin(pin)

      // Store wallet secret with new encryption key
      await BiometricsSDK.storeWalletSecret(this.activeWalletId, mnemonic)

      await BiometricsSDK.clearLegacyWalletData()
      Logger.info('PIN-based keychain migration completed successfully.')
      return true
    } catch (error) {
      Logger.error('PIN-based keychain migration failed:', error)
      return false
    }
  }

  // Path 2: User logs in with Biometrics
  public async runBiometricMigration(): Promise<boolean> {
    try {
      Logger.info('Starting biometric-based keychain migration.')
      const mnemonic = await BiometricsSDK.loadLegacyWalletWithBiometry()
      if (!mnemonic) {
        Logger.error('Could not load legacy wallet with biometrics.')
        return false
      }

      const newEncryptionKey = await BiometricsSDK.generateEncryptionKey()

      // Store raw encryption key in biometric storage ONLY
      await BiometricsSDK.storeEncryptionKeyWithBiometry(newEncryptionKey)

      // Re-encrypt mnemonic and store it
      await BiometricsSDK.storeWalletSecret(this.activeWalletId, mnemonic)

      // DO NOT clear legacy data yet, we need it for PIN completion
      Logger.info(
        'Biometric-based keychain migration (partial) completed successfully.'
      )
      return true
    } catch (error) {
      Logger.error('Biometric-based keychain migration failed:', error)
      return false
    }
  }

  // Path 3: Completing a partial (biometric) migration
  public async completePartialMigration(pin: string): Promise<boolean> {
    try {
      Logger.info('Starting completion of partial migration.')
      // 1. Get the mnemonic from legcacy pin storage
      const mnemonic = await BiometricsSDK.loadLegacyWalletWithPin(pin)
      if (!mnemonic) {
        Logger.error('Could not load legacy wallet with PIN.')
        return false
      }
      // 2. Generate new encryption key
      const newEncryptionKey = await BiometricsSDK.generateEncryptionKey()
      // 3. Store new encryption key for both PIN and Biometry
      await BiometricsSDK.storeEncryptionKeyWithPin(newEncryptionKey, pin)
      await BiometricsSDK.storeEncryptionKeyWithBiometry(newEncryptionKey)

      // 4. Store mnemonic with new encryption key
      await BiometricsSDK.storeWalletSecret(this.activeWalletId, mnemonic)

      // 5. Now that both keys are stored, we can safely remove the legacy data
      await BiometricsSDK.clearLegacyWalletData()

      Logger.info('Partial keychain migration completed successfully.')
      return true
    } catch (error) {
      Logger.error('Failed to complete partial migration:', error)
      return false
    }
  }
}

export default KeychainMigrator
