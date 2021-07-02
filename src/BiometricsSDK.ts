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

  private static storeOptions: Options = {
    accessControl: ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    authenticationPrompt: {
      title: "Store mnemonic",
      subtitle: "To securely store mnemonic on this device put finger on sensor",
      cancel: "cancel"
    },
    authenticationType: AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
    rules: SECURITY_RULES.AUTOMATIC_UPGRADE
  }

  private static loadOptions: Options = {
    accessControl: ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    authenticationPrompt: {
      title: "Load mnemonic",
      subtitle: "To securely load mnemonic from this device put finger on sensor",
      cancel: "cancel"
    },
    authenticationType: AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
    rules: SECURITY_RULES.AUTOMATIC_UPGRADE
  }

  static saveMnemonic = (mnemonic: string): Promise<false | Result> => {
    return Keychain.setGenericPassword("mnemonic", mnemonic, BiometricsSDK.storeOptions)
  }

  static loadMnemonic = (): Promise<false | UserCredentials> => {
    return Keychain.getGenericPassword(BiometricsSDK.loadOptions)
  }

}
