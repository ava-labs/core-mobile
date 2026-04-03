import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, PermissionsAndroid, Platform } from 'react-native'
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions'
import Logger from 'utils/Logger'

export enum BluetoothState {
  POWERED_ON = 'PoweredOn',
  POWERED_OFF = 'PoweredOff',
  UNAUTHORIZED = 'Unauthorized',
  RESETTING = 'Resetting',
  UNSUPPORTED = 'Unsupported',
  UNKNOWN = 'Unknown'
}

interface UseBluetoothReturn {
  /** Radio is on and the app has permission — safe to scan/connect */
  isBluetoothAvailable: boolean
  /** User must open Settings to fix (radio off, app permission denied/unauthorized) */
  isBluetoothBlocked: boolean
  /** CoreBluetooth is still initializing — show a loader and retry */
  isInitializingBluetooth: boolean
  /** Raw state from TransportBLE.observeState */
  bluetoothState: BluetoothState
  /** Imperatively request OS permissions (needed on Android before scanning) */
  requestPermissions: () => Promise<boolean>
}

async function requestAndroidPermissions(): Promise<boolean> {
  try {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    ].filter(Boolean)

    const checks = await Promise.all(
      permissions.map(p => PermissionsAndroid.check(p))
    )
    if (checks.every(Boolean)) return true

    const missing = permissions.filter((_, i) => !checks[i])
    const granted = await PermissionsAndroid.requestMultiple(missing)

    return missing.every(p => granted[p] === PermissionsAndroid.RESULTS.GRANTED)
  } catch (err) {
    Logger.error('useBluetooth: requestAndroidPermissions failed', err)
    return false
  }
}

export async function requestPermissionsAsync(): Promise<boolean> {
  if (Platform.OS === 'android') {
    return requestAndroidPermissions()
  }
  if (Platform.OS === 'ios') {
    try {
      const status = await check(PERMISSIONS.IOS.BLUETOOTH)
      if (status === RESULTS.BLOCKED) return false
    } catch (err) {
      Logger.error('useBluetooth: iOS permission check failed', err)
    }
  }
  return true
}

export async function getBluetoothStateAsync(): Promise<BluetoothState> {
  return new Promise(resolve => {
    const sub = TransportBLE.observeState({
      next: (e: { type: string }) => {
        resolve(e.type as BluetoothState)
        // Defer unsubscribe so `sub` is fully initialized even for synchronous observables
        Promise.resolve()
          .then(() => sub.unsubscribe())
          .catch(() => undefined)
      },
      error: () => {
        resolve(BluetoothState.UNKNOWN)
        Promise.resolve()
          .then(() => sub.unsubscribe())
          .catch(() => undefined)
      },
      complete: () => undefined
    })
  })
}

export async function ensureBluetoothAvailable(): Promise<boolean> {
  const hasPermissions = await requestPermissionsAsync()
  if (!hasPermissions) return false
  const state = await getBluetoothStateAsync()
  return state === BluetoothState.POWERED_ON
}

// Check-only variant — never shows a dialog, safe to call from AppState listeners.
// requestAndroidPermissions shows a system dialog which itself triggers AppState
// changes, causing an infinite loop if called from within an AppState listener.
async function checkAndroidPermissionsGranted(): Promise<boolean> {
  try {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    ].filter(Boolean)
    const results = await Promise.all(
      permissions.map(p => PermissionsAndroid.check(p))
    )
    return results.every(Boolean)
  } catch (err) {
    Logger.error('useBluetooth: checkAndroidPermissions failed', err)
    return false
  }
}

// Tracks Android permission state without showing dialogs.
// Dialogs are only shown via the returned requestPermissions (explicit user action).
// AppState listener uses check-only to detect when the user grants access in Settings.
function useAndroidBluetoothPermission(): boolean {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'android') return

    const checkPermission = async (): Promise<void> => {
      const granted = await checkAndroidPermissionsGranted()
      setIsPermissionGranted(granted)
    }

    checkPermission()

    const appStateRef = { current: AppState.currentState }
    const subscription = AppState.addEventListener('change', nextState => {
      if (appStateRef.current !== 'active' && nextState === 'active') {
        checkPermission()
      }
      appStateRef.current = nextState
    })

    return () => subscription.remove()
  }, [])

  return isPermissionGranted
}

// iOS only: tracks permission state on mount and foreground resume.
// Safe to call check(PERMISSIONS.IOS.BLUETOOTH) here — it never shows a dialog,
// so AppState changes won't cause an infinite loop.
function useIosBluetoothPermission(): boolean {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'ios') return

    const checkPermission = async (): Promise<void> => {
      try {
        const granted = await requestPermissionsAsync()
        setIsPermissionGranted(granted)
      } catch (err) {
        Logger.error('useBluetooth permission check failed', err)
      }
    }

    checkPermission()

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') checkPermission()
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

  const isAndroidPermissionGranted = useAndroidBluetoothPermission()
  const iosPermissionGranted = useIosBluetoothPermission()

  const isPermissionGranted =
    Platform.OS === 'android'
      ? isAndroidPermissionGranted
      : iosPermissionGranted

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
      const state = await getBluetoothStateAsync()
      setBluetoothState(state)
    }

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') recheckState()
    })

    return () => subscription.remove()
  }, [])

  const requestPermissions = useCallback(() => ensureBluetoothAvailable(), [])

  const isBluetoothBlocked =
    bluetoothState === BluetoothState.POWERED_OFF ||
    bluetoothState === BluetoothState.UNAUTHORIZED ||
    !isPermissionGranted

  const isBluetoothAvailable =
    bluetoothState === BluetoothState.POWERED_ON && isPermissionGranted

  const isInitializingBluetooth =
    bluetoothState === BluetoothState.UNKNOWN ||
    bluetoothState === BluetoothState.RESETTING

  return {
    isBluetoothAvailable,
    isBluetoothBlocked,
    isInitializingBluetooth,
    bluetoothState,
    requestPermissions
  }
}
