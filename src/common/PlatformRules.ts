import {Platform} from "react-native"

export class PlatformRules {
  static delayedPress = (onPress: () => void): void => {
    if (Platform.OS === "android") {
      setTimeout(() => {
        onPress()
      }, 200)
    } else {
      onPress()
    }
  }
}
