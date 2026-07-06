import { Href, router } from 'expo-router'

type NavigationOptions = Parameters<typeof router.push>[1]

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
 *
 * Failsafe: each onClosingTransitionStart() schedules a timeout. If the
 * matching onClosingTransitionEnd() is never fired (e.g. an interrupted
 * transition or a stack that lacks the listener), the timeout auto-releases
 * that transition slot so the queue cannot stay stuck indefinitely.
 */

// Generous upper bound — iOS sheet animations finish well under 500 ms.
export const TRANSITION_FAILSAFE_MS = 1000

let closingTransitionCount = 0
const pendingCallbacks: Array<() => void> = []
// One handle per outstanding transition in FIFO order.
const failsafeHandles: ReturnType<typeof setTimeout>[] = []

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

function scheduleFailsafe(): void {
  const handle = setTimeout(() => {
    const idx = failsafeHandles.indexOf(handle)
    if (idx !== -1) failsafeHandles.splice(idx, 1)
    if (closingTransitionCount > 0) closingTransitionCount--
    if (closingTransitionCount === 0) flush()
  }, TRANSITION_FAILSAFE_MS)
  failsafeHandles.push(handle)
}

export function onClosingTransitionStart(): void {
  closingTransitionCount++
  scheduleFailsafe()
}

export function onClosingTransitionEnd(): void {
  // Cancel the oldest failsafe — it corresponds to the earliest unmatched start.
  const handle = failsafeHandles.shift()
  if (handle !== undefined) clearTimeout(handle)
  if (closingTransitionCount > 0) closingTransitionCount--
  if (closingTransitionCount === 0) flush()
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
