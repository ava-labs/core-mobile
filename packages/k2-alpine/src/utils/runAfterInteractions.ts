type Cancelable = { cancel: () => void }

type IdleDeadline = {
  didTimeout: boolean
  timeRemaining: () => number
}
type IdleRequestCallback = (deadline: IdleDeadline) => void

const getRequestIdleCallback = (): ((
  cb: IdleRequestCallback,
  options?: { timeout: number }
) => number) | null => {
  const ric = (globalThis as unknown as { requestIdleCallback?: unknown })
    .requestIdleCallback
  return typeof ric === 'function'
    ? (ric as (cb: IdleRequestCallback, options?: { timeout: number }) => number)
    : null
}

const getCancelIdleCallback = (): ((handle: number) => void) | null => {
  const cic = (globalThis as unknown as { cancelIdleCallback?: unknown })
    .cancelIdleCallback
  return typeof cic === 'function' ? (cic as (handle: number) => void) : null
}

/**
 * Schedule work after the UI is "settled" enough for JS to run without risking
 * jank. Historically this used `InteractionManager.runAfterInteractions`, but
 * InteractionManager is deprecated in RN types.
 *
 * This uses `requestIdleCallback` when available, otherwise falls back to a
 * next-tick `setTimeout(…, 0)`.
 */
export const scheduleAfterInteractions = (
  fn: () => void,
  options?: { timeout?: number }
): Cancelable => {
  let cancelled = false

  const timeout = options?.timeout ?? 1
  const requestIdleCallback = getRequestIdleCallback()
  const cancelIdleCallback = getCancelIdleCallback()

  if (requestIdleCallback && cancelIdleCallback) {
    const handle = requestIdleCallback(
      () => {
        if (!cancelled) fn()
      },
      { timeout }
    )
    return {
      cancel: () => {
        cancelled = true
        cancelIdleCallback(handle)
      }
    }
  }

  // RN "timers" return a number in JS, but TS can type it as NodeJS.Timeout
  // depending on lib setup. We'll treat it opaquely.
  const handle = setTimeout(() => {
    if (!cancelled) fn()
  }, 0) as unknown as number

  return {
    cancel: () => {
      cancelled = true
      clearTimeout(handle as unknown as never)
    }
  }
}


