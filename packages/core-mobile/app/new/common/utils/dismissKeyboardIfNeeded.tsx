import { Keyboard, Platform } from 'react-native'

export const dismissKeyboardIfNeeded = (): void => {
  // native screens need to dismiss the keyboard before navigating
  // the footer is outside of the scrollview that controls keyboardShouldPersistTaps
  // so we need to dismiss it manually
  if (Platform.OS === 'android' && Keyboard.isVisible()) {
    Keyboard.dismiss()
  }
}
