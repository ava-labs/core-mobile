import Keychain, {
  ACCESS_CONTROL,
  ACCESSIBLE,
  AUTHENTICATION_TYPE,
  Options,
  Result,
  SECURITY_RULES,
  UserCredentials
} from "react-native-keychain"


export default class BiometricsSDK {

  static storeOptions: Options = {
    accessControl: ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    authenticationPrompt: {
      title: "Store Wallet",
      subtitle: "Use biometric data to securely store your Avalanche Wallet",
      cancel: "cancel"
    },
    authenticationType: AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
    rules: SECURITY_RULES.AUTOMATIC_UPGRADE
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
    rules: SECURITY_RULES.AUTOMATIC_UPGRADE
  }

  static saveWalletKey = (key: string): Promise<false | Result> => {
    return Keychain.setGenericPassword("wallet", key, BiometricsSDK.storeOptions)
  }

  static loadWalletKey = (options: Options): Promise<false | UserCredentials> => {
    return Keychain.getGenericPassword(options)
  }

  static clearWalletKey = (): Promise<boolean> => {
    return Keychain.resetGenericPassword()
  }
}
