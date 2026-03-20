import { Keyboard, Platform } from 'react-native'

const KEYBOARD_DISMISS_TIMEOUT_MS = 500

/**
 * Dismisses the keyboard and returns a promise that resolves when done.
 *
 * - iOS: resolves immediately (iOS handles keyboard dismiss during transitions).
 * - Android: waits for `keyboardDidHide` event before resolving, with a
 *   {@link KEYBOARD_DISMISS_TIMEOUT_MS} fallback to prevent indefinite hangs.
 *
 * Callers can `await` this before navigating to ensure the keyboard is fully
 * dismissed before the next screen appears.
 */
export const dismissKeyboardIfNeeded = (): Promise<void> => {
  return new Promise(resolve => {
    Keyboard.dismiss()

    if (Platform.OS === 'android') {
      let resolved = false
      const done = (): void => {
        if (!resolved) {
          resolved = true
          subscription.remove()
          clearTimeout(timer)
          resolve()
        }
      }
      const subscription = Keyboard.addListener('keyboardDidHide', done)
      const timer = setTimeout(done, KEYBOARD_DISMISS_TIMEOUT_MS)
    } else {
      resolve()
    }
  })
}
