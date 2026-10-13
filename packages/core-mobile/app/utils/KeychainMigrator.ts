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
  NoMigrationNeeded = 'noMigrationNeeded',
  /**
   * The keychain holds no wallet credential at all — no new encryption keys
   * and no legacy entries to migrate from (e.g. an interrupted wallet deletion
   * wiped the keychain while persisted redux state survived). There is nothing
   * to migrate and no PIN/biometry that could ever unlock this wallet; callers
   * should route to recovery instead of attempting a migration that would
   * surface as an endless "wrong PIN". (CP-14585)
   */
  NoKeychainData = 'noKeychainData'
}

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

    // No new keys. Distinguish "legacy data awaiting migration" from a
    // keychain with no wallet credential at all. The probe is strict — a
    // transient keychain failure throws instead of returning false — so a
    // flaky read can never present as a wiped wallet. (CP-14585)
    if (!(await BiometricsSDK.hasAnyWalletData())) {
      return MigrationStatus.NoKeychainData
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
    if (
      migrationStatus === MigrationStatus.NoMigrationNeeded ||
      // Nothing to migrate from — surface the status so the caller can route
      // to recovery rather than attempting a doomed migration. (CP-14585)
      migrationStatus === MigrationStatus.NoKeychainData
    ) {
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
    const isPinCorrect = await BiometricsSDK.isPinCorrect(pin, true)
    if (!isPinCorrect) {
      throw new BadPinError({
        message: 'Bad PIN'
      })
    }
  }

  /**
   * Runs PIN-based keychain migration.
   * Throws an error if the migration fails.
   * @param pin - The PIN to use for the migration
   */
  async runPinMigration(pin: string): Promise<void> {
    Logger.info('Starting PIN-based keychain migration.')

    const mnemonicResult = await BiometricsSDK.loadLegacyWalletWithPin(pin)
    if (!mnemonicResult.success) {
      throw mnemonicResult.error
    }
    const newEncryptionKey =
      await BiometricsSDK.generateMigrationEncryptionKey()

    // Store the re-encrypted wallet secret BEFORE the new encryption keys
    // (generateMigrationEncryptionKey already cached the key this encrypts
    // with). The presence of a new key is what makes getMigrationStatus
    // report NoMigrationNeeded, so writing keys first opens a crash window
    // where the key exists but the secret doesn't — a state that reads as a
    // wiped wallet after unlock. Secret-first means any interruption leaves
    // the migration re-runnable from the still-intact legacy data. (CP-14585)
    await BiometricsSDK.storeWalletSecret(
      this.activeWalletId,
      mnemonicResult.value
    )

    // Store new encryption key for PIN and also Biometry (if applicable)
    await BiometricsSDK.storeEncryptionKeyWithPin(newEncryptionKey, pin)

    const accessType = BiometricsSDK.getAccessType()
    if (accessType === 'BIO') {
      await BiometricsSDK.storeEncryptionKeyWithBiometry(newEncryptionKey)
    }

    await BiometricsSDK.clearLegacyWalletData()
    Logger.info('PIN-based keychain migration completed successfully.')
  }

  /**
   * Runs biometric-based keychain migration.
   * Throws an error if the migration fails.
   */
  async runBiometricMigration(): Promise<void> {
    Logger.info('Starting biometric-based keychain migration.')
    const mnemonicResult = await BiometricsSDK.loadLegacyWalletWithBiometry()
    if (!mnemonicResult.success) {
      throw new BiometricAuthError({
        message: mnemonicResult.error.message
      })
    }
    const newEncryptionKey =
      await BiometricsSDK.generateMigrationEncryptionKey()

    // Re-encrypt mnemonic and store it — BEFORE the new encryption key, so a
    // crash here leaves the migration re-runnable from legacy data instead of
    // a key-without-secret state that reads as a wiped wallet. (CP-14585)
    await BiometricsSDK.storeWalletSecret(
      this.activeWalletId,
      mnemonicResult.value
    )

    // Store raw encryption key in biometric storage ONLY
    await BiometricsSDK.storeEncryptionKeyWithBiometry(newEncryptionKey)

    // DO NOT clear legacy data yet, we need it for PIN completion
    Logger.info(
      'Biometric-based keychain migration (partial) completed successfully.'
    )
  }

  /**
   * Completes a partial (biometric) migration.
   * Throws an error if the migration fails.
   * @param pin - The PIN to use for the migration
   */
  async completePartialMigration(pin: string): Promise<void> {
    Logger.info('Starting completion of partial migration.')
    // 1. Get the mnemonic from legacy pin storage
    const mnemonicResult = await BiometricsSDK.loadLegacyWalletWithPin(pin)
    if (!mnemonicResult.success) {
      throw mnemonicResult.error
    }
    // 2. Generate new encryption key
    const newEncryptionKey =
      await BiometricsSDK.generateMigrationEncryptionKey()
    // 3. Store mnemonic with the new (cached) encryption key — before the
    // keys, so an interruption leaves the migration re-runnable from legacy
    // data rather than a key-without-secret state. (CP-14585)
    await BiometricsSDK.storeWalletSecret(
      this.activeWalletId,
      mnemonicResult.value
    )
    // 4. Store new encryption key for both PIN and Biometry
    await BiometricsSDK.storeEncryptionKeyWithPin(newEncryptionKey, pin)
    await BiometricsSDK.storeEncryptionKeyWithBiometry(newEncryptionKey)

    // 5. Now that both keys are stored, we can safely remove the legacy data
    await BiometricsSDK.clearLegacyWalletData()

    Logger.info('Partial keychain migration completed successfully.')
  }
}

export default KeychainMigrator
