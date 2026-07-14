import { Keyboard } from 'react-native'

/**
 * Dismiss the soft keyboard when a screen is closing.
 *
 * A keyboard is only ever raised by the screen that owns it, so when that
 * screen closes the keyboard must go with it — otherwise it lingers over the
 * screen behind (CP-14743: the Swap modal's auto-focus keyboard blocking the
 * portfolio). Wired into the navigators' `screenListeners` on the closing
 * `transitionStart` (early — the hide gets the whole close animation) and
 * `transitionEnd` (after the screen is gone — catches a late `focus()`).
 *
 * Guarded by `isVisible()` so it's a no-op on the common close where no
 * keyboard is up.
 */
export function dismissKeyboardOnClose(): void {
  if (Keyboard.isVisible()) {
    Keyboard.dismiss()
  }
}
