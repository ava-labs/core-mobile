import { Href, NavigationOptions, router } from 'expo-router'

/**
 * Navigation guard that prevents new modal screens from being presented while
 * a previous modal's native closing animation is still running on iOS.
 *
 * Background: iOS sheet dismissal animations (~300-400ms) run natively. If a
 * new modal is pushed before the previous one's animation completes, iOS renders
 * the old sheet's native view behind the new one (ghost modal). This guard
 * queues push/navigate/replace calls during any closing transition and flushes
 * them once the animation ends.
 *
 * Wire-up: import this file as a side effect early in the app (e.g. App.js) so
 * the router is patched before any navigation occurs. Then call
 * onClosingTransitionStart/End from screenListeners on the modal Stack navigator.
 *
 * Note: useRouter() from expo-router returns the same router singleton, so
 * patching router here automatically covers all useRouter() call sites.
 */

let closingTransitionCount = 0
const pendingCallbacks: Array<() => void> = []

function flush(): void {
  const pending = pendingCallbacks.splice(0)
  for (const cb of pending) {
    cb()
  }
}

function guardNavigation(cb: () => void): void {
  if (closingTransitionCount === 0) {
    cb()
  } else {
    pendingCallbacks.push(cb)
  }
}

export function onClosingTransitionStart(): void {
  closingTransitionCount++
}

export function onClosingTransitionEnd(): void {
  if (closingTransitionCount > 0) {
    closingTransitionCount--
  }
  if (closingTransitionCount === 0) {
    flush()
  }
}

const originalPush = router.push.bind(router)
const originalNavigate = router.navigate.bind(router)
const originalReplace = router.replace.bind(router)

router.push = (href: Href, options?: NavigationOptions): void =>
  guardNavigation(() => originalPush(href, options))

router.navigate = (href: Href, options?: NavigationOptions): void =>
  guardNavigation(() => originalNavigate(href, options))

router.replace = (href: Href, options?: NavigationOptions): void =>
  guardNavigation(() => originalReplace(href, options))
