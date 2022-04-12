import Keychain, {
  getSupportedBiometryType,
  Options,
  UserCredentials
} from 'react-native-keychain'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {SECURE_ACCESS_SET} from 'resources/Constants'
import {Platform} from 'react-native'

const SERVICE_KEY = 'sec-storage-service'
const SERVICE_KEY_BIO = 'sec-storage-service-bio'
const iOS = Platform.OS === 'ios'

type KeystoreConfigType = {
  KEYSTORE_PASSCODE_OPTIONS: Options
  KEYSTORE_BIO_OPTIONS: Options
  KEYCHAIN_FALLBACK_OPTIONS: Options
}

export const KeystoreConfig: KeystoreConfigType = {
  KEYSTORE_PASSCODE_OPTIONS: {
    service: SERVICE_KEY_BIO,
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
    service: SERVICE_KEY
  },
  KEYCHAIN_FALLBACK_OPTIONS: {
    accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
    service: SERVICE_KEY
  }
}

class BiometricsSDK {
  /**
   * On some android devices loading keystore can take
   * some time on firs run so we call this function
   * early and mask it with splash for smoother UX
   */
  async warmup() {
    await Keychain.getAllGenericPasswordServices()
  }

  async getAccessType(): Promise<string | null> {
    try {
      return AsyncStorage.getItem(SECURE_ACCESS_SET)
    } catch (e) {
      return Promise.reject(null)
    }
  }

  async storeWalletWithPin(walletMnemonic: string, isResetting = false) {
    // if the user is not resetting the pin
    // we mark it as using PIN type. The other two cases are:
    // - User already option is already PIN and is simply changing it
    // - User has BIO but is simply changing the pin. In this case
    // to change the type back to PIN the need to toggle the switch in
    // security & privacy
    if (!isResetting) {
      await AsyncStorage.setItem(SECURE_ACCESS_SET, 'PIN')
    }
    return Keychain.setGenericPassword(
      'wallet',
      walletMnemonic,
      KeystoreConfig.KEYSTORE_PASSCODE_OPTIONS
    )
  }

  async loadWalletWithPin(): Promise<false | UserCredentials> {
    return Keychain.getGenericPassword(KeystoreConfig.KEYSTORE_PASSCODE_OPTIONS)
  }

  /**
   * Stores key under available biometry and prompts user for biometry to check if everytinih is ok.
   * Emits boolean true if everything ok, or throws Error if something whent wrong.
   * @param key - mnemonic to store
   */
  async storeWalletWithBiometry(key: string) {
    await AsyncStorage.setItem(SECURE_ACCESS_SET, 'BIO')
    // reset keystore because we're changing from PIN to BIO
    // await Keychain.resetGenericPassword({service: SERVICE_KEY_BIO});

    // try to store with biometry
    try {
      await Keychain.setGenericPassword(
        'wallet',
        key,
        KeystoreConfig.KEYSTORE_BIO_OPTIONS
      )
      return this.loadWalletKey(KeystoreConfig.KEYSTORE_BIO_OPTIONS)
    } catch (e) {
      // case something goes wrong with biometrics, use use the fallback, which defaults to device code
      try {
        await Keychain.setGenericPassword(
          'wallet',
          key,
          KeystoreConfig.KEYCHAIN_FALLBACK_OPTIONS
        )
        return Promise.resolve(true)
      } catch (ex) {
        return Promise.reject(false)
      }
    }
  }

  async loadWalletKey(options: Options): Promise<false | UserCredentials> {
    return Keychain.getGenericPassword(options)
  }

  async clearWalletKey() {
    return Keychain.resetGenericPassword(
      KeystoreConfig.KEYSTORE_PASSCODE_OPTIONS
    ).then(() =>
      Keychain.resetGenericPassword(KeystoreConfig.KEYSTORE_BIO_OPTIONS)
    )
  }

  async canUseBiometry() {
    return getSupportedBiometryType().then(value => {
      return value !== null
    })
  }

  async getBiometryType() {
    return getSupportedBiometryType()
  }
}

export default new BiometricsSDK()
