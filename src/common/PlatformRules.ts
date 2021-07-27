export class PlatformRules {
  static delayedPress = (onPress: () => void): void => {
    onPress()
  }
}
