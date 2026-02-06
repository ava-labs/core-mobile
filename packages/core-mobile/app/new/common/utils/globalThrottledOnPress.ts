const THROTTLE_DURATION = 300

let lastPressTime = 0

/**
 * A globally shared throttled onPress handler (singleton).
 * Use this to prevent rapid consecutive presses across multiple components.
 * When any action using this handler is triggered, all other actions
 * using this handler will be blocked for 300ms.
 */
export const globalThrottledOnPress = (
  onPress: () => void,
  throttleDuration: number = THROTTLE_DURATION
): void => {
  const now = Date.now()
  if (now - lastPressTime < throttleDuration) {
    return
  }
  lastPressTime = now
  onPress?.()
}

/**
 * Resets the throttle state. Only use this for testing purposes.
 * @internal
 */
export const resetGlobalThrottle = (): void => {
  lastPressTime = 0
}
