import { Keyboard, Platform } from 'react-native'

const KEYBOARD_DISMISS_TIMEOUT_MS = 500

/**
 * Dismisses the keyboard if visible.
 * On Android, waits for the keyboard to fully hide before resolving,
 * so callers can await before navigating to avoid the keyboard
 * lingering over the next screen.
 */
export const dismissKeyboardIfNeeded = (): Promise<void> => {
  return new Promise(resolve => {
    if (!Keyboard.isVisible()) {
      resolve()
      return
    }

    Keyboard.dismiss()

    if (Platform.OS === 'android') {
      let resolved = false
      const done = (): void => {
        if (!resolved) {
          resolved = true
          subscription.remove()
          resolve()
        }
      }
      const subscription = Keyboard.addListener('keyboardDidHide', done)
      setTimeout(done, KEYBOARD_DISMISS_TIMEOUT_MS)
    } else {
      resolve()
    }
  })
}
