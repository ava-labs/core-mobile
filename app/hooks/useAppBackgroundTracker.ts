import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import BiometricsSDK from 'utils/BiometricsSDK'
import moment from 'moment'

/**
 * This hook can tell us if app was in background more than time set by param timeoutMs.
 * @param timeoutMs - set timeout to check against
 * @param setTime - provide persistence for hook to store timestamp
 * @param getTime - provide persistence for hook to load timestamp
 */
export default function useAppBackgroundTracker({
  timeoutMs,
  getTime,
  setTime
}: {
  timeoutMs: number
  getTime: () => Promise<string | null>
  setTime: (time: string) => Promise<void>
}) {
  const appState = useRef(AppState.currentState)
  const [timeoutPassed, setTimeoutPassed] = useState(false)

  /**
   * Handles AppState change. When app is being backgrounded we save the current
   * timestamp.
   *
   * When returning to the foreground take the time the apps was suspended, check the propper
   * states, see if AccessType is set (that determines if user has logged in or not)
   * and we check IF the diff between "now" and the suspended time is greater then our
   * TIMEOUT of 5 sec.
   * @param nextAppState
   */
  const handleAppStateChange = useCallback(
    async (nextAppState: any) => {
      const value = await BiometricsSDK.getAccessType()
      const timeAppWasSuspended = await getTime()
      const suspended = timeAppWasSuspended ?? moment().toISOString()

      const overTimeOut = moment().diff(moment(suspended)) >= timeoutMs

      if (
        (appState.current === 'active' && nextAppState.match(/background/)) ||
        (appState.current === 'inactive' && nextAppState.match(/background/))
      ) {
        // this condition calls when app is in background mode
        // here you can detect application is going to background or inactive.
        await setTime(moment().toISOString())
        setTimeoutPassed(false)
      } else if (
        appState.current.match(/background/) &&
        nextAppState === 'active' &&
        value &&
        overTimeOut
      ) {
        // this condition calls when app is in foreground mode
        // here you can detect application is in active state again.
        setTimeoutPassed(true)
      }
      appState.current = nextAppState
    },
    [getTime, setTime, timeoutMs]
  )

  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange)
    return () => {
      // @ts-ignore - removeEventListener is deprecated
      sub.remove()
    }
  }, [handleAppStateChange])

  return {
    timeoutPassed
  }
}
