import { Href, router, NavigationOptions } from 'expo-router'

/**
 * Navigation guard that prevents new screens from being presented while a
 * previous screen's native closing animation is still running.
 *
 * Background: Native closing animations (~300-400ms) run asynchronously. If a
 * new screen is pushed before the previous one's animation completes, the
 * platform may render stale native views behind the new one (ghost screen).
 * This guard queues push/navigate/replace calls during any closing transition
 * and flushes them once the animation ends.
 *
 * Platform scope: The router patch and the closing-transition counter are
 * platform-agnostic. Callers on any platform (iOS, Android) that invoke
 * onClosingTransitionStart/End will activate the queuing behaviour. Screens
 * or stacks that never call those helpers are unaffected.
 *
 * Wire-up: import this file as a side effect early in the app (e.g. App.js) so
 * the router is patched before any navigation occurs. Then call
 * onClosingTransitionStart/End from screenListeners on the relevant Stack
 * navigator(s).
 *
 * Note: useRouter() from expo-router returns the same router singleton, so
 * patching router here automatically covers all useRouter() call sites. Only
 * navigations triggered while closingTransitionCount > 0 are queued, so any
 * modal whose closing animation does not invoke onClosingTransitionStart/End
 * will not be guarded by this helper.
 */

let closingTransitionCount = 0
const pendingCallbacks: Array<() => void> = []

function flush(): void {
  const pending = pendingCallbacks.splice(0)
  for (const cb of pending) {
    try {
      guardNavigation(cb)
    } catch {
      // Swallow errors from individual callbacks so remaining navigations still flush.
    }
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
