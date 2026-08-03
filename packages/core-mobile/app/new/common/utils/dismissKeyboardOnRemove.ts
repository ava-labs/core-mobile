import { KeyboardController } from 'react-native-keyboard-controller'

/**
 * Dismisses the software keyboard when a route is removed from the navigation
 * stack — header/hardware back, swipe/pan dismiss, and programmatic navigation
 * all dispatch a POP that fires `beforeRemove`.
 *
 * On Android the soft keyboard is not reliably hidden when a modal route
 * unmounts, so it lingers over the screen underneath (CP-14715). This is wired
 * (Android-only) as a navigator-level `screenListeners.beforeRemove` on the
 * root signed-in Stack, which hosts every modal group as a screen, so a single
 * listener covers every modal dismissal (Swap, Send, Staking, Settings
 * sub-screens, …). Verified on-device: the listener fires for native
 * swipe-dismiss and the IME goes down.
 *
 * A navigator-level listener is used deliberately: the native-stack
 * `transitionStart`/`transitionEnd`/`blur` events don't reach a listener
 * registered on the leaving *screen*, because React tears that screen (and its
 * listeners) down first. `screenListeners` live on the navigator, which is not
 * torn down, so `beforeRemove` is delivered reliably.
 *
 * In-flight-tx safety (Swap/Claim/Delegation) is NOT provided by the
 * `defaultPrevented` check below: those screens call `usePreventScreenRemoval`
 * on a *nested* leaf screen, so react-navigation's `shouldPreventRemove`
 * short-circuits in the child navigator and returns before the root Stack ever
 * emits `beforeRemove` — this handler simply never runs when a nested screen
 * blocks removal.
 *
 * The `queueMicrotask` defer + `e.defaultPrevented` check guards the remaining
 * case: a `beforeRemove` listener registered *directly* on a root-level
 * single-screen modal shares this navigator's emitter and runs synchronously
 * alongside this handler. Deferring one microtask lets that listener's
 * `preventDefault()` land first, so we read the final decision and never yank
 * the keyboard away when the removal was actually cancelled.
 *
 * `KeyboardController.dismiss()` hides the IME through the native keyboard
 * controller regardless of which input currently holds focus.
 */
export const dismissKeyboardOnRemove = (e: {
  defaultPrevented: boolean
}): void => {
  queueMicrotask(() => {
    if (!e.defaultPrevented) {
      KeyboardController.dismiss()
    }
  })
}
