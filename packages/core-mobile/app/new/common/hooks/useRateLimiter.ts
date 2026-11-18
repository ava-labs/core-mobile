import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  decreaseCountdown,
  resetLoginAttempt,
  selectLoginAttempt,
  setLoginAttempt
} from 'store/security'

/**
 * Number of failed PIN attempts allowed before the lockout kicks in.
 * WSR-PHYS-002: rate limiting must apply after the 5th failed attempt.
 */
export const MAX_ATTEMPTS_BEFORE_LOCKOUT = 5

/**
 * Lockout (in seconds) applied after the given failed attempt number.
 * 1-4 → no lockout, 5 → 1 min, 6 → 5 min, 7 → 15 min, 8+ → 60 min.
 */
export function getTimeoutForAttempt(
  attempt: number
): 0 | 60 | 300 | 900 | 3600 {
  if (attempt === MAX_ATTEMPTS_BEFORE_LOCKOUT) {
    return 60 // 1 minute
  } else if (attempt === MAX_ATTEMPTS_BEFORE_LOCKOUT + 1) {
    return 300 // 5 minutes
  } else if (attempt === MAX_ATTEMPTS_BEFORE_LOCKOUT + 2) {
    return 900 // 15 min
  } else if (attempt >= MAX_ATTEMPTS_BEFORE_LOCKOUT + 3) {
    return 3600 // 60 minutes
  } else {
    return 0
  }
}

export type RateLimiter = {
  attemptAllowed: boolean
  remainingSeconds: number
  increaseAttempt: () => void
  reset: () => void
}

export function useRateLimiter(): RateLimiter {
  const { count, countdown } = useSelector(selectLoginAttempt)
  const attemptAllowed = useMemo(() => countdown === 0, [countdown])
  const dispatch = useDispatch()

  useEffect(() => {
    //on rate limit attempt change, start counter
    const intervalId =
      countdown > 0
        ? setInterval(() => {
            dispatch(decreaseCountdown())
          }, 1000)
        : undefined

    return () => clearInterval(intervalId)
  }, [count, countdown, dispatch])

  const increaseAttempt = useCallback(() => {
    const currentAttempt = count + 1
    dispatch(
      setLoginAttempt({
        count: currentAttempt,
        countdown: getTimeoutForAttempt(currentAttempt)
      })
    )
  }, [count, dispatch])

  const reset = useCallback(() => {
    dispatch(resetLoginAttempt())
  }, [dispatch])

  return {
    attemptAllowed,
    increaseAttempt,
    reset,
    remainingSeconds: countdown
  }
}
