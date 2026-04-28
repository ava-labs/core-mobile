import { useEffect } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import LedgerService from 'services/ledger/LedgerService'
import Logger from 'utils/Logger'

/**
 * Manages Ledger BLE lifecycle in response to app state changes.
 *
 * - Background / inactive → releases the BLE link so other devices can
 *   connect, but keeps the device ID for auto-reconnect.
 * - Foreground → asks LedgerService to reconnect if eligible (device was
 *   previously connected and auto-reconnect is not disabled).
 *
 * Mount this once inside the signed-in layout so it is active for the
 * entire duration of a Ledger wallet session.
 */
export const useLedgerAppStateListener = (enabled: boolean): void => {
  useEffect(() => {
    if (!enabled) return

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
