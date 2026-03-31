import NetInfo, { useNetInfo } from '@react-native-community/netinfo'
import { showNoInternetToast } from 'common/utils/toast'
import { useSegments } from 'expo-router'
import { useEffect, useRef } from 'react'
import { uuid } from 'utils/uuid'

/**
 * Shows a persistent "No internet connection" toast when offline.
 * Once dismissed, re-appears on tab switch or onboarding screen change.
 */
export const useNoInternetToast = (): void => {
  const { isConnected } = useNetInfo()
  const isDismissedRef = useRef(false)
  const toastIdRef = useRef(uuid())
  const segments = useSegments()

  const triggerToast = (): void => {
    toastIdRef.current = uuid()
    isDismissedRef.current = false
    showNoInternetToast(toastIdRef.current, () => {
      isDismissedRef.current = true
    })
  }

  // Show toast when going offline (ignore null = not yet resolved)
  useEffect(() => {
    if (isConnected === false) {
      triggerToast()
    }
  }, [isConnected])

  // Dismiss toast when coming back online — subscribe directly to NetInfo
  // to avoid React state batching/scheduling delays
  useEffect(() => {
    return NetInfo.addEventListener(state => {
      const online =
        state.isConnected === true && state.isInternetReachable !== false
      if (online) {
        isDismissedRef.current = false
        global.toast?.hideAll()
      }
    })
  }, [])

  // Re-show on tab switch or onboarding screen change if offline + dismissed
  useEffect(() => {
    if (!isDismissedRef.current || isConnected !== false) return

    const isTabRoute = segments[1] === '(tabs)'
    const isOnboardingRoute = segments[0] === 'onboarding'

    if (isTabRoute || isOnboardingRoute) {
      triggerToast()
    }
    // segments reference changes on every navigation event, which is the trigger we want
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments])
}
