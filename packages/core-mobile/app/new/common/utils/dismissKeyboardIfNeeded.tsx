import { Keyboard, Platform } from 'react-native'

export const dismissKeyboardIfNeeded = (): void => {
  if (Platform.OS === 'android' && Keyboard.isVisible()) {
    Keyboard.dismiss()
  }
}
