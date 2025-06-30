import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
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
  getTime: () => string | undefined
  setTime: (time: string) => void
}): {
  timeoutPassed: boolean
} {
  const appState = useRef(AppState.currentState)
  const [timeoutPassed, setTimeoutPassed] = useState(false)

  /**
   * Handles AppState change. When app is being backgrounded we save the current
   * timestamp.
   *
   * When returning to the foreground take the time the apps was suspended, check the proper
   * states, see if AccessType is set (that determines if user has logged in or not)
   * and we check IF the diff between "now" and the suspended time is greater than timeoutMs
   * @param nextAppState
   */
  const handleAppStateChange = useCallback(
    async (nextAppState: any) => {
      if (isGoingToBackground(appState, nextAppState)) {
        setTime(moment().toISOString())
        setTimeoutPassed(false)
      } else if (
        (await isForegroundAndLoggedIn(appState, nextAppState)) &&
        isOverTimeout(getTime, timeoutMs)
      ) {
        setTimeoutPassed(true)
      }
      appState.current = nextAppState
    },
    [getTime, setTime, timeoutMs]
  )

  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange)
    return () => {
      sub.remove()
    }
  }, [handleAppStateChange])

  return {
    timeoutPassed
  }
}

function isGoingToBackground(
  appState: MutableRefObject<
    'active' | 'background' | 'inactive' | 'unknown' | 'extension'
  >,
  nextAppState: any
) {
  return (
    (appState.current === 'active' && nextAppState.match(/background/)) ||
    (appState.current === 'inactive' && nextAppState.match(/background/))
  )
}

async function isForegroundAndLoggedIn(
  appState: MutableRefObject<
    'active' | 'background' | 'inactive' | 'unknown' | 'extension'
  >,
  nextAppState: any
) {
  return (
    appState.current.match(/background/) &&
    nextAppState === 'active' &&
    BiometricsSDK.getAccessType()
  )
}

function isOverTimeout(
  getTime: () => string | undefined,
  timeoutMs: number
): boolean {
  const timeAppWasSuspended = getTime()
  const suspended = timeAppWasSuspended ?? moment().toISOString()
  return moment().diff(moment(suspended)) >= timeoutMs
}
