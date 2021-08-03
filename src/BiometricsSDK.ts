import Keychain, {
  ACCESS_CONTROL,
  ACCESSIBLE,
  AUTHENTICATION_TYPE,
  getAllGenericPasswordServices,
  getSupportedBiometryType,
  Options,
  Result,
  SECURITY_RULES,
  UserCredentials
} from "react-native-keychain"
import {from, Observable} from "rxjs"
import {catchError, map, switchMap, tap} from "rxjs/operators"


export default class BiometricsSDK {

  static storePinOptions: Options = {
    accessControl: ACCESS_CONTROL.APPLICATION_PASSWORD,
    accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    rules: SECURITY_RULES.AUTOMATIC_UPGRADE,
    service: "pin"
  }

  static storeOptions: Options = {
    accessControl: ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    authenticationPrompt: {
      title: "Store Wallet",
      subtitle: "Use biometric data to securely store your Avalanche Wallet",
      cancel: "cancel"
    },
    authenticationType: AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
    rules: SECURITY_RULES.AUTOMATIC_UPGRADE,
    service: "mnemonic"
  }

  static loadOptions: Options = {
    accessControl: ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    authenticationPrompt: {
      title: "Unlock Wallet",
      subtitle: "Use biometric unlock to access your Avalanche Wallet",
      cancel: "cancel"
    },
    authenticationType: AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
    rules: SECURITY_RULES.AUTOMATIC_UPGRADE,
    service: "mnemonic"
  }

  static storeWalletWithPin = (pin: string, walletMnemonic: string): Promise<false | Result> => {
    return Keychain.setGenericPassword(pin, walletMnemonic, BiometricsSDK.storePinOptions)
  }
  static loadWalletWithPin = (): Promise<false | UserCredentials> => {
    return Keychain.getGenericPassword(BiometricsSDK.storePinOptions)
  }

  /**
   * Stores key under available biometry and prompts user for biometry to check if everytinih is ok.
   * Emits boolean true if everything ok, or throws Error if something whent wrong.
   * @param key - mnemonic to store
   */
  static storeWalletWithBiometry(key: string): Observable<boolean> {
    return from(BiometricsSDK.saveWalletKey(key)).pipe(
      switchMap(credentials => {
        if (credentials === false) {
          throw Error("Error saving mnemonic")
        }
        return BiometricsSDK.loadWalletKey(BiometricsSDK.storeOptions)
      }),
      map(credentials => {
        if (credentials === false) {
          throw Error("Error saving mnemonic")
        }
        return true
      }),
      catchError((err: Error) => {
        return from(BiometricsSDK.clearWalletKey()).pipe(
          tap(() => {
            throw err
          })
        )
      })
    )
  }

  static saveWalletKey = (key: string): Promise<false | Result> => {
    return Keychain.setGenericPassword("wallet", key, BiometricsSDK.storeOptions)
  }

  static loadWalletKey = (options: Options): Promise<false | UserCredentials> => {
    return Keychain.getGenericPassword(options)
  }

  static clearWalletKey = (): Promise<boolean> => {
    return Keychain.resetGenericPassword(BiometricsSDK.storePinOptions).then(value =>
      Keychain.resetGenericPassword(BiometricsSDK.storeOptions)
    )
  }

  static canUseBiometry = (): Promise<boolean> => {
    return getSupportedBiometryType().then(value => {
      return value !== null
    })
  }

  static getBiometryType = (): Promise<string> => {
    return getSupportedBiometryType().then(value => {
      console.log(value)
      return value as string
    })
  }

  static hasWalletStored = (): Promise<boolean> => {
    return getAllGenericPasswordServices().then((value) => {
      return value.length !== 0
    })
  }
}
