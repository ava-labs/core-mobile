import Keychain, {
  ACCESS_CONTROL,
  ACCESSIBLE,
  AUTHENTICATION_TYPE,
  Options,
  Result,
  SECURITY_RULES,
  UserCredentials
} from "react-native-keychain"

const options: Options = {
  accessControl: ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
  accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  authenticationPrompt: {
    title: "Store mnemonic",
    description: "To securely store mnemonic on this device put finger on sensor",
    subtitle: "subtitle",
    cancel: "cancel"
  },
  authenticationType: AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
  rules: SECURITY_RULES.AUTOMATIC_UPGRADE
}

export default {
  loadMnemonic: (): Promise<false | UserCredentials> => {
    return Keychain.getGenericPassword(options)
  },
  saveMnemonic: (mnemonic: string): Promise<false | Result> => {
    return Keychain.setGenericPassword("mnemonic", mnemonic, options)
  },
}
