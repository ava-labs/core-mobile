import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import LedgerService from 'services/ledger/LedgerService'
import Logger from 'utils/Logger'

/**
 * Manages Ledger BLE lifecycle in response to app state changes.
 *
 * - enabled true → false: forgets the device so we don't attempt stale
 *   auto-reconnects (e.g. user switches away from a Ledger wallet).
 *   Only fires on a true→false transition, not on initial mount.
 * - Background / inactive → releases the BLE link so other devices can
 *   connect, but keeps the device ID for auto-reconnect.
 * - Foreground → asks LedgerService to reconnect if eligible (device was
 *   previously connected and auto-reconnect is not disabled).
 */
export const useLedgerAppStateListener = (enabled: boolean): void => {
  const wasEnabledRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      if (wasEnabledRef.current) {
        LedgerService.forgetDevice()
      }
      return
    }
    wasEnabledRef.current = true

    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        const isBackground =
          nextState === 'background' || nextState === 'inactive'
        const isForeground = nextState === 'active'

        if (isBackground && LedgerService.isConnected()) {
          Logger.info(
            'App backgrounded — releasing BLE (auto-reconnect enabled)'
          )
          LedgerService.disconnect({ manual: false }).catch(Logger.error)
        } else if (isForeground && !LedgerService.isConnected()) {
          LedgerService.scheduleReconnect('app-foreground')
        }
      }
    )

    return () => subscription.remove()
  }, [enabled])
}
