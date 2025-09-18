import { Keyboard, Platform } from 'react-native'

export const dismissKeyboardIfNeeded = (): void => {
  // (Android) native screens need to dismiss the keyboard before navigating
  // the footer is outside of the scrollview that controls keyboardShouldPersistTaps
  // so on Android we need to dismiss it manually
  if (Platform.OS === 'android' && Keyboard.isVisible()) {
    Keyboard.dismiss()
  }
}
