import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, Platform } from 'react-native'
import BluetoothService from 'services/bluetooth/BluetoothService'
import { BluetoothState } from 'services/bluetooth/types'

interface UseBluetoothReturn {
  /** Bluetooth is available and ready to use (permissions granted, radio on, and initialized) */
  isBluetoothReady: boolean
  /** Radio is on and the app has permission — safe to scan/connect */
  isBluetoothOnAndPermissionGranted: boolean
  /** Radio is on — safe to scan/connect for android to request permissions*/
  isBluetoothAvailable: boolean
  /** User must open Settings to fix (radio off, app permission denied/unauthorized) */
  isBluetoothBlocked: boolean
  /** CoreBluetooth is still initializing — show a loader and retry */
  isInitializingBluetooth: boolean
  /** Raw state from TransportBLE.observeState */
  bluetoothState: BluetoothState
  /** Open Bluetooth system settings or app settings */
  openSettings: () => void
}

// iOS: tracks permission state on mount and foreground resume.
// Safe to call check(PERMISSIONS.IOS.BLUETOOTH) here — it never shows a dialog,
// so AppState changes won't cause an infinite loop.

// Android: tracks permission state without showing dialogs.
// Permission prompts are triggered elsewhere via the async permission-request flow.
// AppState listener uses check-only to detect grants made in Settings or after an explicit request.
function useBluetoothPermission(): boolean {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'android') return

    const checkPermission = async (): Promise<void> => {
      const granted = await (Platform.OS === 'ios'
        ? BluetoothService.requestPermissionsAsync()
        : BluetoothService.checkAndroidPermissionsGranted())
      setIsPermissionGranted(granted)
    }

    checkPermission()

    const appStateRef = { current: AppState.currentState }
    const subscription = AppState.addEventListener('change', nextState => {
      // this is a treatment for android only, otherwise android will trigger checkPermission infinitely.
      // for iOS, simply checking nextState === 'active' is enough
      if (appStateRef.current !== 'active' && nextState === 'active') {
        checkPermission()
      }
      appStateRef.current = nextState
    })

    return () => subscription.remove()
  }, [])

  return isPermissionGranted
}

export function useBluetooth(): UseBluetoothReturn {
  const [bluetoothState, setBluetoothState] = useState<BluetoothState>(
    BluetoothState.UNKNOWN
  )
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  const isPermissionGranted = useBluetoothPermission()

  // Subscribe to BT radio state changes via TransportBLE
  useEffect(() => {
    if (subscriptionRef.current) return
    subscriptionRef.current = TransportBLE.observeState({
      next: (e: { type: string }) => {
        setBluetoothState(e.type as BluetoothState)
      },
      error: () => {
        setBluetoothState(BluetoothState.UNKNOWN)
      },
      complete: () => undefined
    })
    return () => {
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
    }
  }, [])

  // Re-check BT state when app comes to foreground (e.g. user enabled BT in Settings)
  useEffect(() => {
    const recheckState = async (): Promise<void> => {
      const state = await BluetoothService.getBluetoothStateAsync()
      setBluetoothState(state)
    }

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') recheckState()
    })

    return () => subscription.remove()
  }, [])

  const isBluetoothBlocked =
    bluetoothState === BluetoothState.POWERED_OFF ||
    bluetoothState === BluetoothState.UNAUTHORIZED ||
    bluetoothState === BluetoothState.UNSUPPORTED ||
    !isPermissionGranted

  const isBluetoothAvailable =
    bluetoothState === BluetoothState.POWERED_ON && isPermissionGranted

  const isBluetoothOnAndPermissionGranted =
    isBluetoothAvailable && isPermissionGranted

  const isBluetoothReady =
    (isBluetoothAvailable && Platform.OS === 'android') ||
    (isBluetoothOnAndPermissionGranted && Platform.OS === 'ios')

  const isInitializingBluetooth =
    bluetoothState === BluetoothState.UNKNOWN ||
    bluetoothState === BluetoothState.RESETTING

  const openSettings = useCallback(() => {
    BluetoothService.openSettingsForState(
      bluetoothState,
      Platform.OS as 'android' | 'ios'
    )
  }, [bluetoothState])

  return {
    isBluetoothReady,
    isBluetoothOnAndPermissionGranted,
    isBluetoothAvailable,
    isBluetoothBlocked,
    isInitializingBluetooth,
    bluetoothState,
    openSettings
  }
}
