import { ErrorBase } from 'errors/ErrorBase'
import { Result } from 'types/result'
import BiometricsSDK from './BiometricsSDK'
import Logger from './Logger'
import { assertNotUndefined } from './assertions'

export class MigrationFailedError extends ErrorBase<'MigrationFailedError'> {}
export class BadPinError extends ErrorBase<'BadPinError'> {}
export class BiometricAuthError extends ErrorBase<'BiometricAuthError'> {}

export enum MigrationStatus {
  RunPinMigration = 'runPinMigration',
  RunBiometricMigration = 'runBiometricMigration',
  CompletePartialMigration = 'completePartialMigration',
  NoMigrationNeeded = 'noMigrationNeeded'
}

/**
 * Migrate keychain data to secure store for the following use cases:
 * 1. migrate legacy service keys used for backwards compatibility to secure store
 * 2. migrate keychain data to secure store
 */
class KeychainMigrator {
  private activeWalletId: string

  constructor(activeWalletId: string) {
    this.activeWalletId = activeWalletId
    Logger.info('KeychainMigrator initialized for wallet:', activeWalletId)
  }

  public async getMigrationStatus(
    accessType: 'PIN' | 'BIO'
  ): Promise<MigrationStatus> {
    // Check for legacy wallet data with both PIN and biometrics
    const newPinKeyExists = await BiometricsSDK.hasEncryptionKeyWithPin()
    //fully migrated
    if (newPinKeyExists) {
      return MigrationStatus.NoMigrationNeeded
    }

    const newBioKeyExists = await BiometricsSDK.hasEncryptionKeyWithBiometry()
    //new bio exists, but accessType is bio so no need to migrate
    if (newBioKeyExists && accessType === 'BIO') {
      return MigrationStatus.NoMigrationNeeded
    }

    // no pin key, but bio key exists
    if (newBioKeyExists) {
      return MigrationStatus.CompletePartialMigration
    }

    //no keys exist
    return accessType === 'PIN'
      ? MigrationStatus.RunPinMigration
      : MigrationStatus.RunBiometricMigration
  }

  public async migrateIfNeeded(
    accessType: 'PIN' | 'BIO',
    pin?: string
  ): Promise<Result<MigrationStatus>> {
    const migrationStatus = await this.getMigrationStatus(accessType)
    if (migrationStatus === MigrationStatus.NoMigrationNeeded) {
      return { success: true, value: migrationStatus }
    }

    try {
      Logger.info('Migration needed:', migrationStatus)

      if (accessType === 'PIN') {
        await this.throwIfBadPin(pin)
        assertNotUndefined(pin) // throwIfBadPin already checks for undefined

        switch (migrationStatus) {
          case 'runPinMigration':
            await this.runPinMigration(pin)
            break
          case 'completePartialMigration':
            await this.completePartialMigration(pin)
            break
          default:
            Logger.error('Unexpected migration status:', migrationStatus)
            throw new MigrationFailedError({
              message: 'Unexpected migration status'
            })
        }
      } else {
        if (migrationStatus === 'runBiometricMigration') {
          await this.runBiometricMigration()
        } else {
          Logger.error('Unexpected migration status:', migrationStatus)
          throw new MigrationFailedError({
            message: 'Unexpected migration status'
          })
        }
      }
      return { success: true, value: migrationStatus }
    } catch (error) {
      if (
        error instanceof BadPinError ||
        error instanceof MigrationFailedError ||
        error instanceof BiometricAuthError
      ) {
        throw error
      }
      throw new MigrationFailedError({
        message: `Migration failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      })
    }
  }

  private async throwIfBadPin(pin?: string): Promise<void> {
    if (!pin) {
      throw new BadPinError({
        message: 'PIN is required for PIN migration'
      })
    }
    // const isPinCorrect = await BiometricsSDK.isPinCorrect(pin, true)
    const [isPinCorrect, isKeychainDataCorrect] = await Promise.all([
      BiometricsSDK.isPinCorrect(pin, true),
      BiometricsSDK.isPinCorrect(pin, false)
    ])
    if (!isPinCorrect && !isKeychainDataCorrect) {
      throw new BadPinError({
        message: 'Bad PIN'
      })
    }
  }

  /**
   * Migrate legacy service keys used for backwards compatibility to secure store
   * Runs PIN-based keychain migration.
   * Throws an error if the migration fails.
   * @param pin - The PIN to use for the migration
   */
  async runPinMigration(pin: string): Promise<void> {
    Logger.info('Starting PIN-based keychain migration.')

    const [legacyMnemonicResult, keychainMnemonicResult] = await Promise.all([
      BiometricsSDK.loadLegacyWalletWithPin(pin),
      BiometricsSDK.loadKeychainDataWithPin(pin)
    ])
    if (!legacyMnemonicResult.success && !keychainMnemonicResult.success) {
      throw new Error('Failed to load legacy or keychain wallet with PIN')
    }

    let mnemonic = ''
    if (legacyMnemonicResult.success) {
      mnemonic = legacyMnemonicResult.value
    }
    if (keychainMnemonicResult.success) {
      mnemonic = keychainMnemonicResult.value
    }

    const newEncryptionKey =
      await BiometricsSDK.generateMigrationEncryptionKey()

    // Store new encryption key for PIN and also Biometry (if applicable)
    await BiometricsSDK.storeEncryptionKeyWithPin(newEncryptionKey, pin)

    const accessType = BiometricsSDK.getAccessType()
    if (accessType === 'BIO') {
      await BiometricsSDK.storeEncryptionKeyWithBiometry(newEncryptionKey)
    }
    await BiometricsSDK.loadEncryptionKeyWithPin(pin)

    // Store wallet secret with new encryption key
    await BiometricsSDK.storeWalletSecret(this.activeWalletId, mnemonic)

    await BiometricsSDK.clearKeychainData()
    Logger.info('PIN-based keychain migration completed successfully.')
  }

  /**
   * Migrate legacy service keys used for backwards compatibility to secure store
   * Runs biometric-based keychain migration.
   * Throws an error if the migration fails.
   */
  async runBiometricMigration(): Promise<void> {
    Logger.info('Starting biometric-based keychain migration.')
    const [legacyMnemonicResult, keychainMnemonicResult] = await Promise.all([
      BiometricsSDK.loadLegacyWalletWithBiometry(),
      BiometricsSDK.loadKeychainDataWithBiometry()
    ])
    if (!legacyMnemonicResult.success && !keychainMnemonicResult.success) {
      throw new BiometricAuthError({
        message: 'Failed to load legacy or keychain wallet with biometry'
      })
    }
    let mnemonic = ''
    if (legacyMnemonicResult.success) {
      mnemonic = legacyMnemonicResult.value
    }
    if (keychainMnemonicResult.success) {
      mnemonic = keychainMnemonicResult.value
    }
    const newEncryptionKey =
      await BiometricsSDK.generateMigrationEncryptionKey()

    // Store raw encryption key in biometric storage ONLY
    await BiometricsSDK.storeEncryptionKeyWithBiometry(newEncryptionKey)

    // Re-encrypt mnemonic and store it
    await BiometricsSDK.storeWalletSecret(this.activeWalletId, mnemonic)

    // DO NOT clear legacy data yet, we need it for PIN completion
    Logger.info(
      'Biometric-based keychain migration (partial) completed successfully.'
    )
  }

  /**
   * Migrate legacy service keys used for backwards compatibility to secure store
   * Completes a partial (biometric) migration.
   * Throws an error if the migration fails.
   * @param pin - The PIN to use for the migration
   */
  async completePartialMigration(pin: string): Promise<void> {
    Logger.info('Starting completion of partial migration.')
    // 1. Get the mnemonic from legacy pin storage
    const [legacyMnemonicResult, keychainMnemonicResult] = await Promise.all([
      BiometricsSDK.loadLegacyWalletWithPin(pin),
      BiometricsSDK.loadKeychainDataWithPin(pin)
    ])
    if (!legacyMnemonicResult.success && !keychainMnemonicResult.success) {
      throw new Error('Failed to load legacy or keychain wallet with PIN')
    }
    let mnemonic = ''
    if (legacyMnemonicResult.success) {
      mnemonic = legacyMnemonicResult.value
    }
    if (keychainMnemonicResult.success) {
      mnemonic = keychainMnemonicResult.value
    }
    // 2. Generate new encryption key
    const newEncryptionKey =
      await BiometricsSDK.generateMigrationEncryptionKey()
    // 3. Store new encryption key for both PIN and Biometry
    await BiometricsSDK.storeEncryptionKeyWithPin(newEncryptionKey, pin)
    await BiometricsSDK.storeEncryptionKeyWithBiometry(newEncryptionKey)

    // 4. Store mnemonic with new encryption key
    await BiometricsSDK.storeWalletSecret(this.activeWalletId, mnemonic)

    // 5. Now that both keys are stored, we can safely remove the keychain data
    await BiometricsSDK.clearKeychainData()

    Logger.info('Partial keychain migration completed successfully.')
  }
}

export default KeychainMigrator
