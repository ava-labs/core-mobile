import { Keyboard } from 'react-native'

export const dismissKeyboardIfNeeded = (): void => {
  // native screens need to dismiss the keyboard before navigating
  // the footer is outside of the scrollview that controls keyboardShouldPersistTaps
  // we need to dismiss it manually
  if (Keyboard.isVisible()) {
    Keyboard.dismiss()
  }
}
