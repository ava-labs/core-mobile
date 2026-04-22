import { useNetInfo } from '@react-native-community/netinfo'
import { showNoInternetToast } from 'common/utils/toast'
import { useSegments } from 'expo-router'
import { useEffect, useRef } from 'react'
import { uuid } from 'utils/uuid'

/**
 * Shows a persistent "No internet connection" toast when offline.
 * Once dismissed, re-appears on tab switch or seedless onboarding screen change.
 */
export const useNoInternetToast = (): void => {
  const isDismissedRef = useRef(false)
  const isConnectedRef = useRef(true)
  const toastIdRef = useRef(uuid())
  const segments = useSegments() as string[]

  const triggerToast = (): void => {
    toastIdRef.current = uuid()
    isDismissedRef.current = false
    showNoInternetToast(toastIdRef.current, () => {
      isDismissedRef.current = true
    })
  }

  const { isConnected, isInternetReachable } = useNetInfo()

  // Single NetInfo listener handles both show and hide.
  // isInternetReachable !== false treats null as online to avoid false flash on mount.
  useEffect(() => {
    // Wait until NetInfo has a confirmed reading
    if (isConnected === null) return

    const online = isConnected === true && isInternetReachable !== false

    if (online && !isConnectedRef.current) {
      isConnectedRef.current = true
      isDismissedRef.current = false
      global.toast?.hideAll()
    } else if (!online && isConnectedRef.current) {
      isConnectedRef.current = false
      triggerToast()
    }
  }, [isConnected, isInternetReachable])

  // Re-show on tab switch or seedless onboarding screen change if offline + dismissed
  useEffect(() => {
    if (!isDismissedRef.current || isConnectedRef.current) return

    const isTabRoute = segments[1] === '(tabs)'
    const isOnboardingRoute =
      segments[1] === 'seedless' || segments[0] === 'signup'

    if (isTabRoute || isOnboardingRoute) {
      triggerToast()
    }
  }, [segments])
}
