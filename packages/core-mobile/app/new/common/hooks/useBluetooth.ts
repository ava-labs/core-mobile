import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, Platform } from 'react-native'
import BluetoothService from 'services/bluetooth/BluetoothService'
import { BluetoothState } from 'services/bluetooth/types'

interface UseBluetoothReturn {
  /** Radio is on and the app has permission — safe to scan/connect */
  isBluetoothOnAndPermissionGranted: boolean
  /** Radio is on — safe to scan/connect, but may need to request permissions */
  isBluetoothAvailable: boolean
  /** User must open Settings to fix (radio off, app permission denied/unauthorized) */
  isBluetoothBlocked: boolean
  /** CoreBluetooth is still initializing — show a loader and retry */
  isInitializingBluetooth: boolean
  /** Raw state from TransportBLE.observeState */
  bluetoothState: BluetoothState
  /** Open Bluetooth system settings or app settings */
  openSettings: () => void
  /** Request Bluetooth permissions */
  requestPermissions: () => Promise<boolean>
}

// On mount, requestPermissions() is called to prompt the user if not yet determined.
// The AppState listener uses check-only to detect grants made in Settings after the initial prompt.
function useBluetoothPermission(): boolean {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)

  useEffect(() => {
    const checkAndRequestPermissions = async (): Promise<void> => {
      const granted = await BluetoothService.requestPermissions()
      setIsPermissionGranted(granted)
    }

    checkAndRequestPermissions()

    const subscription = AppState.addEventListener(
      'change',
      async nextState => {
        if (nextState === 'active') {
          const granted = await BluetoothService.checkPermissions()
          setIsPermissionGranted(granted)
        }
      }
    )

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
    subscriptionRef.current =
      BluetoothService.observeBluetoothState(setBluetoothState)
    return () => {
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
    }
  }, [])

  // Re-check BT state when app comes to foreground (e.g. user enabled BT in Settings)
  useEffect(() => {
    const recheckState = async (): Promise<void> => {
      const state = await BluetoothService.getBluetoothState()
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

  const isBluetoothAvailable = bluetoothState === BluetoothState.POWERED_ON

  const isBluetoothOnAndPermissionGranted =
    isBluetoothAvailable && isPermissionGranted

  const isInitializingBluetooth =
    bluetoothState === BluetoothState.UNKNOWN ||
    bluetoothState === BluetoothState.RESETTING

  const openSettings = useCallback(() => {
    BluetoothService.openSettingsForState(
      bluetoothState,
      Platform.OS as 'android' | 'ios'
    )
  }, [bluetoothState])

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    return BluetoothService.requestPermissions()
  }, [])

  return {
    isBluetoothOnAndPermissionGranted,
    isBluetoothAvailable,
    isBluetoothBlocked,
    isInitializingBluetooth,
    bluetoothState,
    openSettings,
    requestPermissions
  }
}
