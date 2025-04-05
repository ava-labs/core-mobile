import Keychain, {
  getSupportedBiometryType,
  Options,
  UserCredentials
} from 'react-native-keychain'
import { StorageKey } from 'resources/Constants'
import { Platform } from 'react-native'
import { commonStorage } from 'utils/mmkv'
import Logger from './Logger'

export const SERVICE_KEY = 'sec-storage-service'
export const SERVICE_KEY_BIO = 'sec-storage-service-bio'
const iOS = Platform.OS === 'ios'

type KeystoreConfigType = {
  KEYSTORE_PASSCODE_OPTIONS: Options
  KEYSTORE_BIO_OPTIONS: Options
  KEYCHAIN_FALLBACK_OPTIONS: Options
}

export const KeystoreConfig: KeystoreConfigType = {
  KEYSTORE_PASSCODE_OPTIONS: {
    service: SERVICE_KEY,
    accessControl: iOS
      ? undefined
      : Keychain.ACCESS_CONTROL.APPLICATION_PASSWORD,
    rules: iOS ? undefined : Keychain.SECURITY_RULES.NONE
  },
  KEYSTORE_BIO_OPTIONS: {
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    authenticationPrompt: {
      title: 'Store Wallet',
      subtitle: 'Use biometric data to securely store your Avalanche Wallet',
      cancel: 'cancel'
    },
    authenticationType:
      Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
    service: SERVICE_KEY_BIO
  },
  KEYCHAIN_FALLBACK_OPTIONS: {
    accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
    service: SERVICE_KEY
  }
}

class BiometricsSDK {
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

  async storeWalletWithPin(
    walletId: string,
    encryptedMnemonic: string,
    isResetting = false
  ): Promise<false | Keychain.Result> {
    // if the user is not resetting the pin
    // we mark it as using PIN type. The other two cases are:
    // - User already option is already PIN and is simply changing it
    // - User has BIO but is simply changing the pin. In this case
    // to change the type back to PIN the need to toggle the switch in
    // security & privacy
    if (!isResetting) {
      commonStorage.set(StorageKey.SECURE_ACCESS_SET, 'PIN')
    }
    return Keychain.setGenericPassword(walletId, encryptedMnemonic, {
      ...KeystoreConfig.KEYSTORE_PASSCODE_OPTIONS,
      service: `${SERVICE_KEY}-${walletId}`
    })
  }

  async loadWalletWithPin(walletId: string): Promise<false | UserCredentials> {
    return Keychain.getGenericPassword({
      ...KeystoreConfig.KEYSTORE_PASSCODE_OPTIONS,
      service: `${SERVICE_KEY}-${walletId}`
    })
  }

  /**
   * Stores key under available biometry and prompts user for biometry to check if everything is ok.
   * Emits boolean true if everything ok, or throws Error if something went wrong.
   * @param walletId - unique identifier for the wallet
   * @param key - mnemonic to store
   */
  async storeWalletWithBiometry(
    walletId: string,
    key: string
  ): Promise<boolean> {
    commonStorage.set(StorageKey.SECURE_ACCESS_SET, 'BIO')
    // try to store with biometry
    try {
      await Keychain.setGenericPassword(walletId, key, {
        ...KeystoreConfig.KEYSTORE_BIO_OPTIONS,
        service: `${SERVICE_KEY_BIO}-${walletId}`
      })

      return true
    } catch (e) {
      Logger.error('failed to store with biometry', e)
      // case something goes wrong with biometrics, use the fallback, which defaults to device code
      try {
        await Keychain.setGenericPassword(walletId, key, {
          ...KeystoreConfig.KEYCHAIN_FALLBACK_OPTIONS,
          service: `${SERVICE_KEY}-${walletId}`
        })
        return true
      } catch (ex) {
        Logger.error('failed to store with device code fallback', e)
        return false
      }
    }
  }

  /**
   * Disables biometric authentication by removing biometric credentials and resetting to PIN-only access.
   * @param walletId - unique identifier for the wallet
   */
  async disableBiometry(walletId: string): Promise<void> {
    try {
      // Remove biometric credentials
      await Keychain.resetGenericPassword({
        service: `${SERVICE_KEY_BIO}-${walletId}`
      })

      // Reset storage to indicate PIN-only access
      commonStorage.set(StorageKey.SECURE_ACCESS_SET, 'PIN')
    } catch (error) {
      Logger.error('Failed to disable biometry:', error)
      throw error
    }
  }

  async loadWalletKey(
    walletId: string,
    options: Options
  ): Promise<false | UserCredentials> {
    return Keychain.getGenericPassword({
      ...options,
      service: `${SERVICE_KEY}-${walletId}`
    })
  }

  async clearAllWalletKeys(): Promise<void> {
    try {
      const services = await Keychain.getAllGenericPasswordServices()
      await Promise.all(
        services.map(service => Keychain.resetGenericPassword({ service }))
      )
      commonStorage.delete(StorageKey.SECURE_ACCESS_SET)
    } catch (error) {
      Logger.error('Failed to clear wallet keys:', error)
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
}

export default new BiometricsSDK()

export enum BiometricType {
  FACE_ID = 'Face ID',
  TOUCH_ID = 'Touch ID',
  IRIS = 'Iris',
  NONE = 'None'
}
