import { TextInput } from 'react-native'
import { KeyboardController } from 'react-native-keyboard-controller'

/**
 * Sweep away a keyboard that no screen owns.
 *
 * Call this after a navigation change (from a reliable screen focus/blur
 * event). If the keyboard is still up but no `TextInput` is focused, the screen
 * that raised it is gone and nothing will take it down — it lingers over the
 * screen behind (CP-14743: the Swap modal's auto-focus keyboard blocking the
 * portfolio).
 *
 * RN's own `Keyboard.dismiss()` is a no-op in exactly this state: it hides the
 * keyboard by blurring the *currently focused* input, and there is none. So we
 * use `KeyboardController.dismiss()` (react-native-keyboard-controller), which
 * hides the soft keyboard at the native window level regardless of focus.
 *
 * The check is deferred one frame so the outgoing screen's input has unmounted
 * and cleared focus before we read it — otherwise we'd still see the stale
 * focused input and skip. The focus guard means a keyboard the destination
 * screen legitimately wants (its own input is focused) is never dismissed.
 */
export function dismissKeyboardIfOrphaned(): void {
  requestAnimationFrame(() => {
    if (
      KeyboardController.isVisible() &&
      TextInput.State.currentlyFocusedInput() == null
    ) {
      KeyboardController.dismiss()
    }
  })
}
