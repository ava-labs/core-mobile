import Keychain, {
  SetOptions,
  GetOptions,
  BaseOptions,
  hasGenericPassword
} from 'react-native-keychain'
import { StorageKey } from 'resources/Constants'
import { Platform } from 'react-native'
import { commonStorage } from 'utils/mmkv'
import { decrypt, encrypt } from 'utils/EncryptionHelper'
import Aes from 'react-native-aes-crypto'
import { Result } from 'types/result'
import {
  AuthenticationType,
  hasHardwareAsync,
  isEnrolledAsync,
  supportedAuthenticationTypesAsync
} from 'expo-local-authentication'
import Logger from './Logger'
import { assertNotNull } from './assertions'

/**
 * @deprecated Legacy service keys used for backwards compatibility
 */
const LEGACY_SERVICE_KEY = 'sec-storage-service'

/**
 * @deprecated Legacy service keys used for backwards compatibility
 */
const LEGACY_SERVICE_KEY_BIO = 'sec-storage-service-bio'

const getWalletServiceKey = (walletId: string): string =>
  `sec-storage-service-${walletId}`
export const ENCRYPTION_KEY_SERVICE = 'encryption-key-service'
export const ENCRYPTION_KEY_SERVICE_BIO = 'encryption-key-service-bio'
const iOS = Platform.OS === 'ios'

const COMMON_BIO_PROMPT = {
  title: 'Access Wallet',
  subtitle: 'Use biometric data to access securely stored wallet information',
  cancel: 'Cancel'
}

export const passcodeGetOptions: GetOptions = {
  service: ENCRYPTION_KEY_SERVICE,
  accessControl: iOS ? undefined : Keychain.ACCESS_CONTROL.APPLICATION_PASSWORD
}

export const passcodeSetOptions: SetOptions = {
  ...passcodeGetOptions,
  securityLevel: iOS ? undefined : Keychain.SECURITY_LEVEL.ANY
}

export const bioGetOptions: GetOptions = {
  service: ENCRYPTION_KEY_SERVICE_BIO,
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
  authenticationPrompt: COMMON_BIO_PROMPT
}

export const bioSetOptions: SetOptions = {
  ...bioGetOptions,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
}

export const walletSecretOptions = (walletId: string): BaseOptions => ({
  service: getWalletServiceKey(walletId)
})

class BiometricsSDK {
  #encryptionKey: string | null = null

  /**
   * On some android devices loading keystore can take
   * some time on first run, so we call this function
   * early and mask it with splash for smoother UX
   */
  async warmup(): Promise<void> {
    await Keychain.getAllGenericPasswordServices()
  }

  getAccessType(): string | undefined {
    return commonStorage.getString(StorageKey.SECURE_ACCESS_SET)
  }

  // Generate a new encryption key
  async generateEncryptionKey(): Promise<string> {
    return Aes.randomKey(32)
  }

  clearEncryptionKey(): void {
    this.#encryptionKey = null
  }

  // Migration-specific methods
  async loadLegacyWalletWithPin(pin: string): Promise<Result<string>> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: LEGACY_SERVICE_KEY_BIO
      })
      if (!credentials)
        return { success: false, error: new Error('No credentials found') }

      const decrypted = await decrypt(credentials.password, pin)
      if (!decrypted)
        return { success: false, error: new Error('Failed to decrypt') }

      return { success: true, value: decrypted.data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  }

  async loadLegacyWalletWithBiometry(): Promise<Result<string>> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: LEGACY_SERVICE_KEY,
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        authenticationPrompt: {
          title: 'Authorize access',
          subtitle: 'Use biometric data to migrate your wallet',
          cancel: 'Cancel'
        }
      })
      if (!credentials)
        return { success: false, error: new Error('No credentials found') }

      return { success: true, value: credentials.password }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  }

  async clearLegacyWalletData(): Promise<void> {
    await Keychain.resetGenericPassword({ service: LEGACY_SERVICE_KEY })
    await Keychain.resetGenericPassword({ service: LEGACY_SERVICE_KEY_BIO })
  }

  // Encryption Key Management
  async hasEncryptionKeyWithPin(): Promise<boolean> {
    try {
      return await hasGenericPassword(passcodeGetOptions)
    } catch (e) {
      Logger.error('Failed to check encryption key existence', e)
      return false
    }
  }

  async hasEncryptionKeyWithBiometry(): Promise<boolean> {
    try {
      return await hasGenericPassword(bioGetOptions)
    } catch (e) {
      Logger.error('Failed to check encryption key existence', e)
      return false
    }
  }

  async loadEncryptionKeyWithPin(pin: string): Promise<boolean> {
    const credentials = await Keychain.getGenericPassword(passcodeGetOptions)
    if (!credentials) return false
    const decrypted = await decrypt(credentials.password, pin)
    if (!decrypted) return false
    this.#encryptionKey = decrypted.data
    return true
  }

  async loadEncryptionKeyWithBiometry(): Promise<boolean> {
    const credentials = await Keychain.getGenericPassword(bioGetOptions)
    if (!credentials) return false
    this.#encryptionKey = credentials.password
    return true
  }

  async storeEncryptionKeyWithPin(
    encryptionKey: string,
    pin: string
  ): Promise<boolean> {
    commonStorage.set(StorageKey.SECURE_ACCESS_SET, 'PIN')
    const encrypted = await encrypt(encryptionKey, pin)
    await Keychain.setGenericPassword(
      'encryptionKey',
      encrypted,
      passcodeSetOptions
    )
    this.#encryptionKey = encryptionKey
    return true
  }

  /**
   * Stores the encryption key with biometry
   * Use this if pin is not yet set, likely when migrating from legacy
   * Use {@link enableBiometry} otherwise
   * @param encryptionKey - The encryption key to store
   * @returns true if the encryption key was stored successfully, false otherwise
   */
  async storeEncryptionKeyWithBiometry(
    encryptionKey: string
  ): Promise<boolean> {
    commonStorage.set(StorageKey.SECURE_ACCESS_SET, 'BIO')
    try {
      await Keychain.setGenericPassword(
        'encryptionKey',
        encryptionKey,
        bioSetOptions
      )
      this.#encryptionKey = encryptionKey
      return true
    } catch (e) {
      Logger.error('failed to store encryption key with biometry', e)
      return false
    }
  }

  /**
   * Clears encryption_key_service and re-encrypts the encryption key with the new pin.
   * No need to reset encryption_key_service_bio since it doesn't use pin.
   * @param newPin - The new pin to set
   * @throws Error if the encryption key is not found in cache.
   */
  async changePin(newPin: string): Promise<void> {
    await Keychain.resetGenericPassword({
      service: ENCRYPTION_KEY_SERVICE
    })
    await Keychain.resetGenericPassword({
      service: LEGACY_SERVICE_KEY
    })
    await this.storeEncryptionKeyWithPin(this.encryptionKey, newPin)
  }

  // Wallet Secret Management
  async storeWalletSecret(walletId: string, secret: string): Promise<boolean> {
    const encrypted = await encrypt(secret, this.encryptionKey)
    await Keychain.setGenericPassword(
      'walletSecret',
      encrypted,
      walletSecretOptions(walletId)
    )
    return true
  }

  async removeWalletSecret(walletId: string): Promise<boolean> {
    try {
      await Keychain.resetGenericPassword(walletSecretOptions(walletId))
      return true
    } catch (e) {
      Logger.error(
        `Failed to remove wallet secret for service: ${
          walletSecretOptions(walletId).service
        }`,
        e
      )
      return false
    }
  }

  private get encryptionKey(): string {
    assertNotNull(this.#encryptionKey, 'Encryption key not found')
    return this.#encryptionKey
  }

  async loadWalletSecret(walletId: string): Promise<Result<string>> {
    try {
      const credentials = await Keychain.getGenericPassword(
        walletSecretOptions(walletId)
      )
      if (!credentials)
        return { success: false, error: new Error('No credentials found') }

      const decrypted = await decrypt(credentials.password, this.encryptionKey)
      if (!decrypted)
        return { success: false, error: new Error('Failed to decrypt') }

      return { success: true, value: decrypted.data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  }

  async clearWalletData(walletId: string): Promise<void> {
    try {
      await Keychain.resetGenericPassword(walletSecretOptions(walletId))
    } catch (e) {
      Logger.error(
        `Failed to reset keychain for service: ${
          walletSecretOptions(walletId).service
        }`,
        e
      )
    }
    commonStorage.delete(StorageKey.SECURE_ACCESS_SET)
  }

  async clearAllData(): Promise<void> {
    try {
      const servicesToClear = [
        ENCRYPTION_KEY_SERVICE,
        ENCRYPTION_KEY_SERVICE_BIO,
        LEGACY_SERVICE_KEY,
        LEGACY_SERVICE_KEY_BIO
      ]
      for (const service of servicesToClear) {
        await Keychain.resetGenericPassword({ service })
      }

      const services = await Keychain.getAllGenericPasswordServices({
        skipUIAuth: true
      })
      const walletPrefix = 'sec-storage-service-'
      for (const service of services) {
        if (service.startsWith(walletPrefix)) {
          await Keychain.resetGenericPassword({ service })
        }
      }
      commonStorage.delete(StorageKey.SECURE_ACCESS_SET)
    } catch (e) {
      Logger.error('Failed to clear all keychain data', e)
    }
  }

  async getSupportedAuthenticationTypes(): Promise<AuthenticationType[]> {
    return supportedAuthenticationTypesAsync()
  }

  async canUseBiometry(): Promise<boolean> {
    const supportedAuthenticationTypes =
      await this.getSupportedAuthenticationTypes()
    const hasBiometricHardware = await hasHardwareAsync()
    const isEnrolled = await isEnrolledAsync()
    return (
      supportedAuthenticationTypes.length > 0 &&
      hasBiometricHardware &&
      isEnrolled
    )
  }

  async getAuthenticationTypes(): Promise<AuthenticationType[]> {
    const authTypes = await this.getSupportedAuthenticationTypes()

    const isEnrolled = await isEnrolledAsync()
    if (isEnrolled === false) return []

    // if device has enrolled biometrics, but no supported authentication types returned,
    // we can assume it's facial recognition
    // this is a workaround for app-accessible APIs do not distinguish
    // between biometric modalities (fingerprint, face) on android
    if (authTypes.length === 0 && Platform.OS === 'android') {
      return [AuthenticationType.FACIAL_RECOGNITION]
    }
    return authTypes
  }

  /**
   * Enables biometry if pin is set
   * Use {@link storeEncryptionKeyWithBiometry} otherwise
   * @throws Error if the encryption key is not found in cache.
   */
  async enableBiometry(): Promise<boolean> {
    return await this.storeEncryptionKeyWithBiometry(this.encryptionKey)
  }

  async disableBiometry(): Promise<void> {
    commonStorage.set(StorageKey.SECURE_ACCESS_SET, 'PIN')
    await Keychain.resetGenericPassword({
      service: ENCRYPTION_KEY_SERVICE_BIO
    })
    await Keychain.resetGenericPassword({
      service: LEGACY_SERVICE_KEY_BIO
    })
  }

  /**
   * Checks if the entered PIN is correct by attempting to unlock
   * either LEGACY_SERVICE_KEY_BIO or ENCRYPTION_KEY_SERVICE
   * @param pin - The PIN to validate
   * @param isLegacy - Whether to use the legacy service key
   * @returns true if the PIN successfully unlocks any stored data, false otherwise
   */
  async isPinCorrect(pin: string, isLegacy: boolean): Promise<boolean> {
    try {
      if (isLegacy) {
        const legacyResult = await this.loadLegacyWalletWithPin(pin)
        return legacyResult.success
      } else {
        return await this.loadEncryptionKeyWithPin(pin)
      }
    } catch (error) {
      Logger.error('Failed to validate PIN', error)
      return false
    }
  }
}

export default new BiometricsSDK()
