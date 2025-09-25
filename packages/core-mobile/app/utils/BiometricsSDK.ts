import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { StorageKey } from 'resources/Constants'
import { commonStorage } from 'utils/mmkv'
import { decrypt, encrypt } from 'utils/EncryptionHelper'
import Aes from 'react-native-aes-crypto'
import { Result } from 'types/result'
import Keychain, { GetOptions } from 'react-native-keychain'
import { Platform } from 'react-native'
import Logger from './Logger'
import { assertNotNull } from './assertions'

const COMMON_BIO_PROMPT = {
  promptMessage: 'Access Wallet',
  fallbackLabel: 'Use passcode'
}

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

const bioAuthenticationOptions: LocalAuthentication.LocalAuthenticationOptions =
  {
    promptMessage: COMMON_BIO_PROMPT.promptMessage,
    fallbackLabel: COMMON_BIO_PROMPT.fallbackLabel,
    cancelLabel: 'Cancel'
  }

export const passcodeGetKeyChainOptions: GetOptions = {
  service: ENCRYPTION_KEY_SERVICE,
  accessControl: iOS ? undefined : Keychain.ACCESS_CONTROL.APPLICATION_PASSWORD
}

export const bioGetKeyChainOptions: GetOptions = {
  service: ENCRYPTION_KEY_SERVICE_BIO,
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET
}

type SecureStoreItemAsyncProps = {
  key: string
  options: SecureStore.SecureStoreOptions
}

export const passcodeSecureStoreOptions: SecureStoreItemAsyncProps = {
  key: ENCRYPTION_KEY_SERVICE,
  options: {
    keychainService: ENCRYPTION_KEY_SERVICE,
    requireAuthentication: false,
    authenticationPrompt: COMMON_BIO_PROMPT.promptMessage
  }
}

export const bioSecureStoreOptions: SecureStoreItemAsyncProps = {
  key: ENCRYPTION_KEY_SERVICE_BIO,
  options: {
    keychainService: ENCRYPTION_KEY_SERVICE_BIO,
    requireAuthentication: true,
    authenticationPrompt: COMMON_BIO_PROMPT.promptMessage,
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  }
}

class BiometricsSDK {
  #encryptionKey: string | null = null

  getAccessType(): string | undefined {
    return commonStorage.getString(StorageKey.SECURE_ACCESS_SET)
  }

  async generateEncryptionKey(): Promise<string> {
    if (this.#encryptionKey) {
      return this.#encryptionKey
    }
    this.#encryptionKey = await Aes.randomKey(32)
    return this.#encryptionKey
  }

  clearEncryptionKey(): void {
    this.#encryptionKey = null
  }

  async generateMigrationEncryptionKey(): Promise<string> {
    this.clearEncryptionKey()
    this.#encryptionKey = await Aes.randomKey(32)
    return this.#encryptionKey
  }

  /**
   * Migration legacy wallet methods - migrate legacy wallet with pin
   * @param pin - The PIN to use for the migration
   * @returns The decrypted data if successful, error otherwise
   */
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

  /**
   * Migration legacy wallet methods - migrate legacy wallet with biometry
   * @param pin - The PIN to use for the migration
   * @returns The decrypted data if successful, error otherwise
   */
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

  /**
   * Migration keychain data methods - migrate keychain data to secure store with same pin
   * @param pin - The PIN to use for the migration
   * @returns The decrypted data if successful, error otherwise
   */
  async loadKeychainDataWithPin(pin: string): Promise<Result<string>> {
    try {
      const credentials = await Keychain.getGenericPassword(
        passcodeGetKeyChainOptions
      )
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

  /**
   * Migration legacy wallet methods - migrate legacy wallet with biometry
   * @param pin - The PIN to use for the migration
   * @returns The decrypted data if successful, error otherwise
   */
  async loadKeychainDataWithBiometry(): Promise<Result<string>> {
    try {
      const credentials = await Keychain.getGenericPassword(
        bioGetKeyChainOptions
      )
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

  /**
   * Migration legacy wallet methods - clear legacy wallet data
   */
  async clearKeychainData(): Promise<void> {
    await Keychain.resetGenericPassword({ service: LEGACY_SERVICE_KEY })
    await Keychain.resetGenericPassword({ service: LEGACY_SERVICE_KEY_BIO })
    await Keychain.resetGenericPassword(passcodeGetKeyChainOptions)
    await Keychain.resetGenericPassword(bioGetKeyChainOptions)
  }

  async hasEncryptionKeyWithPin(): Promise<boolean> {
    try {
      const value = await SecureStore.getItemAsync(
        passcodeSecureStoreOptions.key,
        passcodeSecureStoreOptions.options
      )
      return !!value
    } catch (e) {
      Logger.error('Failed to check encryption key existence', e)
      return false
    }
  }

  async hasEncryptionKeyWithBiometry(): Promise<boolean> {
    try {
      const value = await SecureStore.getItemAsync(
        bioSecureStoreOptions.key,
        bioSecureStoreOptions.options
      )
      return !!value
    } catch (e) {
      Logger.error('Failed to check encryption key existence', e)
      return false
    }
  }

  async loadEncryptionKeyWithPin(pin: string): Promise<boolean> {
    const encrypted = await SecureStore.getItemAsync(
      passcodeSecureStoreOptions.key,
      passcodeSecureStoreOptions.options
    )
    if (!encrypted) return false
    const decrypted = await decrypt(encrypted, pin)
    if (!decrypted) return false
    this.#encryptionKey = decrypted.data
    return true
  }

  async loadEncryptionKeyWithBiometry(): Promise<boolean> {
    const key = await SecureStore.getItemAsync(
      bioSecureStoreOptions.key,
      bioSecureStoreOptions.options
    )
    if (!key) return false
    this.#encryptionKey = key
    return true
  }

  async storeEncryptionKeyWithPin(
    encryptionKey: string,
    pin: string
  ): Promise<boolean> {
    commonStorage.set(StorageKey.SECURE_ACCESS_SET, 'PIN')
    const encrypted = await encrypt(encryptionKey, pin)
    await SecureStore.setItemAsync(
      passcodeSecureStoreOptions.key,
      encrypted,
      passcodeSecureStoreOptions.options
    )
    this.#encryptionKey = encryptionKey
    return true
  }

  async storeEncryptionKeyWithBiometry(
    encryptionKey: string
  ): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(
        bioSecureStoreOptions.key,
        encryptionKey,
        bioSecureStoreOptions.options
      )
      this.#encryptionKey = encryptionKey
      commonStorage.set(StorageKey.SECURE_ACCESS_SET, 'BIO')
      return true
    } catch (e) {
      Logger.error('failed to store encryption key with biometry', e)
      return false
    }
  }

  async changePin(newPin: string): Promise<void> {
    await SecureStore.deleteItemAsync(
      passcodeSecureStoreOptions.key,
      passcodeSecureStoreOptions.options
    )
    await this.storeEncryptionKeyWithPin(this.encryptionKey, newPin)
  }

  async storeWalletSecret(walletId: string, secret: string): Promise<boolean> {
    const encrypted = await encrypt(secret, this.encryptionKey)
    await SecureStore.setItemAsync(getWalletServiceKey(walletId), encrypted, {
      keychainService: getWalletServiceKey(walletId)
    })
    return true
  }

  async removeWalletSecret(walletId: string): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(getWalletServiceKey(walletId), {
        keychainService: getWalletServiceKey(walletId)
      })
      return true
    } catch (e) {
      Logger.error(
        `Failed to remove wallet secret for service: ${getWalletServiceKey(
          walletId
        )}`,
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
      const encrypted = await SecureStore.getItemAsync(
        getWalletServiceKey(walletId),
        { keychainService: getWalletServiceKey(walletId) }
      )
      if (!encrypted)
        return { success: false, error: new Error('No credentials found') }

      const decrypted = await decrypt(encrypted, this.encryptionKey)
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
      await SecureStore.deleteItemAsync(getWalletServiceKey(walletId), {
        keychainService: getWalletServiceKey(walletId)
      })
    } catch (e) {
      Logger.error(
        `Failed to reset secure store for service: ${getWalletServiceKey(
          walletId
        )}`,
        e
      )
    }
    commonStorage.delete(StorageKey.SECURE_ACCESS_SET)
  }

  async clearAllData(walletIds: string[]): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(
        passcodeSecureStoreOptions.key,
        passcodeSecureStoreOptions.options
      )
      await SecureStore.deleteItemAsync(
        bioSecureStoreOptions.key,
        bioSecureStoreOptions.options
      )

      for (const walletId of walletIds) {
        await SecureStore.deleteItemAsync(getWalletServiceKey(walletId), {
          keychainService: getWalletServiceKey(walletId)
        })
      }

      commonStorage.delete(StorageKey.SECURE_ACCESS_SET)
    } catch (e) {
      Logger.error('Failed to clear all secure store data', e)
    }
  }

  async canUseBiometry(): Promise<boolean> {
    const type = await LocalAuthentication.supportedAuthenticationTypesAsync()
    return type.length > 0
  }

  async getBiometryType(): Promise<BiometricType> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return BiometricType.TOUCH_ID
    }
    if (
      types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    ) {
      return BiometricType.FACE_ID
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return BiometricType.IRIS
    }
    return BiometricType.NONE
  }

  async enableBiometry(): Promise<boolean> {
    return await this.storeEncryptionKeyWithBiometry(this.encryptionKey)
  }

  async disableBiometry(): Promise<void> {
    commonStorage.set(StorageKey.SECURE_ACCESS_SET, 'PIN')
    await SecureStore.deleteItemAsync(
      bioSecureStoreOptions.key,
      bioSecureStoreOptions.options
    )
  }

  async isPinCorrect(pin: string, isLegacy: boolean): Promise<boolean> {
    try {
      if (isLegacy) {
        const legacyResult = await this.loadLegacyWalletWithPin(pin)
        return legacyResult.success
      } else {
        const keychainResult = await this.loadKeychainDataWithPin(pin)
        return keychainResult.success
      }
    } catch (error) {
      Logger.error('Failed to validate PIN', error)
      return false
    }
  }

  async authenticateAsync(): Promise<boolean> {
    try {
      const isEnrolled = await this.isEnrolledAsync()
      if (!isEnrolled) {
        Logger.error(
          'Failed to authenticate with biometric',
          new Error('Biometric not enrolled')
        )
        return false
      }
      const result = await LocalAuthentication.authenticateAsync(
        bioAuthenticationOptions
      )
      return result.success
    } catch (error) {
      Logger.error('Failed to authenticate with biometric', error)
      return false
    }
  }

  async isEnrolledAsync(): Promise<boolean> {
    return LocalAuthentication.isEnrolledAsync()
  }
}

export default new BiometricsSDK()

export enum BiometricType {
  FACE_ID = 'Face ID',
  TOUCH_ID = 'Touch ID',
  IRIS = 'Iris',
  NONE = 'None'
}
