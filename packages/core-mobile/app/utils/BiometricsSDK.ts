import Keychain, {
  getSupportedBiometryType,
  Options
} from 'react-native-keychain'
import { StorageKey } from 'resources/Constants'
import { Platform } from 'react-native'
import { commonStorage } from 'utils/mmkv'
import { decrypt, encrypt } from 'utils/EncryptionHelper'
import Aes from 'react-native-aes-crypto'
import Logger from './Logger'

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
const ENCRYPTION_KEY_SERVICE = 'encryption-key-service'
const ENCRYPTION_KEY_SERVICE_BIO = 'encryption-key-service-bio'
const iOS = Platform.OS === 'ios'

type KeystoreConfigType = {
  ENCRYPTION_KEY_PASSCODE_OPTIONS: Options
  ENCRYPTION_KEY_BIO_OPTIONS: Options
  wallet_secret_options: (walletId: string) => Options
}

export const KeystoreConfig: KeystoreConfigType = {
  ENCRYPTION_KEY_PASSCODE_OPTIONS: {
    service: ENCRYPTION_KEY_SERVICE,
    accessControl: iOS
      ? undefined
      : Keychain.ACCESS_CONTROL.APPLICATION_PASSWORD,
    rules: iOS ? undefined : Keychain.SECURITY_RULES.NONE
  },
  ENCRYPTION_KEY_BIO_OPTIONS: {
    service: ENCRYPTION_KEY_SERVICE_BIO,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    authenticationPrompt: {
      title: 'Access Wallet',
      subtitle:
        'Use biometric data to access securely stored wallet information',
      cancel: 'Cancel'
    },
    authenticationType:
      Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS
  },
  wallet_secret_options: (walletId: string) => ({
    service: getWalletServiceKey(walletId)
  })
}

class BiometricsSDK {
  private encryptionKey: string | null = null

  /**
   * On some android devices loading keystore can take
   * some time on first run, so we call this function
   * early and mask it with splash for smoother UX
   */
  async warmup(): Promise<void> {
    await Keychain.getAllGenericPasswordServices()
  }

  getAccessType(): string {
    return commonStorage.getString(StorageKey.SECURE_ACCESS_SET) ?? 'PIN'
  }

  // Generate a new encryption key
  async generateEncryptionKey(): Promise<string> {
    return Aes.randomKey(32)
  }

  clearEncryptionKey(): void {
    this.encryptionKey = null
  }

  // Migration-specific methods
  async loadLegacyWalletWithPin(pin: string): Promise<false | string> {
    const credentials = await Keychain.getGenericPassword({
      service: LEGACY_SERVICE_KEY_BIO
    })
    if (!credentials) return false
    const decrypted = await decrypt(credentials.password, pin)
    if (!decrypted) return false
    return decrypted.data
  }

  async loadLegacyWalletWithBiometry(): Promise<false | string> {
    const credentials = await Keychain.getGenericPassword({
      service: LEGACY_SERVICE_KEY,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      authenticationPrompt: {
        title: 'Authorize access',
        subtitle: 'Use biometric data to migrate your wallet',
        cancel: 'Cancel'
      },
      authenticationType:
        Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS
    })
    if (!credentials) return false
    return credentials.password
  }

  async clearLegacyWalletData(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({ service: LEGACY_SERVICE_KEY })
      await Keychain.resetGenericPassword({ service: LEGACY_SERVICE_KEY_BIO })
    } catch (e) {
      Logger.error(`Failed to reset legacy keychain data`, e)
    }
  }

  // Encryption Key Management
  async hasEncryptionKeyWithPin(): Promise<boolean> {
    try {
      const credentials = await Keychain.getGenericPassword(
        KeystoreConfig.ENCRYPTION_KEY_PASSCODE_OPTIONS
      )
      return credentials !== false
    } catch (e) {
      Logger.error('Failed to check encryption key existence', e)
      return false
    }
  }

  async hasEncryptionKeyWithBiometry(): Promise<boolean> {
    try {
      const credentials = await Keychain.getGenericPassword(
        KeystoreConfig.ENCRYPTION_KEY_BIO_OPTIONS
      )
      return credentials !== false
    } catch (e) {
      Logger.error('Failed to check encryption key existence', e)
      return false
    }
  }

  async loadEncryptionKeyWithPin(pin: string): Promise<boolean> {
    const credentials = await Keychain.getGenericPassword(
      KeystoreConfig.ENCRYPTION_KEY_PASSCODE_OPTIONS
    )
    if (!credentials) return false
    const decrypted = await decrypt(credentials.password, pin)
    if (!decrypted) return false
    this.encryptionKey = decrypted.data
    return true
  }

  async loadEncryptionKeyWithBiometry(): Promise<boolean> {
    const credentials = await Keychain.getGenericPassword(
      KeystoreConfig.ENCRYPTION_KEY_BIO_OPTIONS
    )
    if (!credentials) return false
    this.encryptionKey = credentials.password
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
      KeystoreConfig.ENCRYPTION_KEY_PASSCODE_OPTIONS
    )
    this.encryptionKey = encryptionKey
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
        KeystoreConfig.ENCRYPTION_KEY_BIO_OPTIONS
      )
      this.encryptionKey = encryptionKey
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
    await this.storeEncryptionKeyWithPin(this.getEncryptionKey(), newPin)
  }

  // Wallet Secret Management
  async storeWalletSecret(
    walletId: string,
    secret: string
  ): Promise<false | Keychain.Result> {
    const encrypted = await encrypt(secret, this.getEncryptionKey())
    return Keychain.setGenericPassword(
      'walletSecret',
      encrypted,
      KeystoreConfig.wallet_secret_options(walletId)
    )
  }

  private getEncryptionKey(): string {
    if (!this.encryptionKey) {
      throw new Error(
        'Encryption key not found in cache. Cannot store wallet secret.'
      )
    }
    return this.encryptionKey
  }

  async loadWalletSecret(walletId: string): Promise<false | string> {
    const credentials = await Keychain.getGenericPassword(
      KeystoreConfig.wallet_secret_options(walletId)
    )
    if (!credentials) return false
    const decrypted = await decrypt(
      credentials.password,
      this.getEncryptionKey()
    )
    return decrypted.data
  }

  async clearWalletData(walletId: string): Promise<void> {
    try {
      await Keychain.resetGenericPassword(
        KeystoreConfig.wallet_secret_options(walletId)
      )
    } catch (e) {
      Logger.error(
        `Failed to reset keychain for service: ${
          KeystoreConfig.wallet_secret_options(walletId).service
        }`,
        e
      )
    }
    commonStorage.delete(StorageKey.SECURE_ACCESS_SET)
  }

  async clearAllData(): Promise<void> {
    try {
      const services = await Keychain.getAllGenericPasswordServices()
      const walletPrefix = 'sec-storage-service-'
      const servicesToClear = [
        ENCRYPTION_KEY_SERVICE,
        ENCRYPTION_KEY_SERVICE_BIO,
        LEGACY_SERVICE_KEY,
        LEGACY_SERVICE_KEY_BIO
      ]
      for (const service of services) {
        if (
          service.startsWith(walletPrefix) ||
          servicesToClear.includes(service)
        ) {
          await Keychain.resetGenericPassword({ service })
        }
      }
      commonStorage.delete(StorageKey.SECURE_ACCESS_SET)
    } catch (e) {
      Logger.error('Failed to clear all keychain data', e)
    }
  }

  async canUseBiometry(): Promise<boolean> {
    return getSupportedBiometryType().then(value => {
      return value !== null
    })
  }

  async getBiometryType(): Promise<BiometricType> {
    const bioType = await getSupportedBiometryType()
    if (!bioType) return BiometricType.NONE
    switch (bioType) {
      case Keychain.BIOMETRY_TYPE.FINGERPRINT:
      case Keychain.BIOMETRY_TYPE.TOUCH_ID:
        return BiometricType.TOUCH_ID
      case Keychain.BIOMETRY_TYPE.FACE_ID:
      case Keychain.BIOMETRY_TYPE.FACE:
        return BiometricType.FACE_ID
      case Keychain.BIOMETRY_TYPE.IRIS:
        return BiometricType.IRIS
    }
  }

  /**
   * Enables biometry if pin is set
   * Use {@link storeEncryptionKeyWithBiometry} otherwise
   * @throws Error if the encryption key is not found in cache.
   */
  async enableBiometry(): Promise<void> {
    await this.storeEncryptionKeyWithBiometry(this.getEncryptionKey())
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
}

export default new BiometricsSDK()

export enum BiometricType {
  FACE_ID = 'Face ID',
  TOUCH_ID = 'Touch ID',
  IRIS = 'Iris',
  NONE = 'None'
}
