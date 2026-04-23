import { showNoInternetToast } from 'common/utils/toast'
import { useSegments } from 'expo-router'
import { useEffect, useRef } from 'react'
import { uuid } from 'utils/uuid'
import { useOnlineStatus } from './useOnlineStatus'

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

  const isOnline = useOnlineStatus()

  // Show/hide toast based on connectivity state.
  useEffect(() => {
    if (isOnline && !isConnectedRef.current) {
      isConnectedRef.current = true
      isDismissedRef.current = false
      global.toast?.hideAll()
    } else if (!isOnline && isConnectedRef.current) {
      isConnectedRef.current = false
      triggerToast()
    }
  }, [isOnline])

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
