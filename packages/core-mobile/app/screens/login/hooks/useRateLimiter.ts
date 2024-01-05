import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  decreaseCountdown,
  resetLoginAttempt,
  selectLoginAttempt,
  setLoginAttempt
} from 'store/security'

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
        countdown: getTimoutForAttempt(currentAttempt)
      })
    )
  }, [count, dispatch])

  const reset = useCallback(() => {
    dispatch(resetLoginAttempt())
  }, [dispatch])

  function getTimoutForAttempt(attempt: number): 0 | 60 | 300 | 900 | 3600 {
    if (attempt === 6) {
      return 60 // 1 minute
    } else if (attempt === 7) {
      return 300 // 5 minutes
    } else if (attempt === 8) {
      return 900 // 15 min
    } else if (attempt >= 9) {
      return 3600 // 60 minutes
    } else {
      return 0
    }
  }

  return {
    attemptAllowed,
    increaseAttempt,
    reset,
    remainingSeconds: countdown
  }
}
