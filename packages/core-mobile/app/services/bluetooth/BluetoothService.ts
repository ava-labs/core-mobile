import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { Linking, PermissionsAndroid, Platform } from 'react-native'
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions'
import Logger from 'utils/Logger'
import { BluetoothAvailability, BluetoothState } from './types'

export class BluetoothService {
  async requestPermissionsAsync(): Promise<boolean> {
    if (Platform.OS === 'android') {
      return this.requestAndroidPermissions()
    }
    if (Platform.OS === 'ios') {
      try {
        const status = await check(PERMISSIONS.IOS.BLUETOOTH)
        if (status === RESULTS.BLOCKED) return false
      } catch (err) {
        Logger.error('BluetoothService: iOS permission check failed', err)
      }
    }
    return true
  }

  async getBluetoothStateAsync(): Promise<BluetoothState> {
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

  async ensureBluetoothAvailable(): Promise<BluetoothAvailability> {
    const [state, hasPermission] = await Promise.all([
      this.getBluetoothStateAsync(),
      this.requestPermissionsAsync()
    ])
    return { hasPermission, state }
  }

  // Check-only variant — never shows a dialog, safe to call from AppState listeners.
  // requestAndroidPermissions shows a system dialog which itself triggers AppState
  // changes, causing an infinite loop if called from within an AppState listener.
  async checkAndroidPermissionsGranted(): Promise<boolean> {
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
      Logger.error('BluetoothService: checkAndroidPermissions failed', err)
      return false
    }
  }

  openSystemBluetoothSettings(platform: 'android' | 'ios'): void {
    if (platform === 'android') {
      Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS').catch(
        Logger.error
      )
    } else if (platform === 'ios') {
      Linking.openURL('App-Prefs:Bluetooth').catch(Logger.error)
    }
  }

  private async requestAndroidPermissions(): Promise<boolean> {
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

      return missing.every(
        p => granted[p] === PermissionsAndroid.RESULTS.GRANTED
      )
    } catch (err) {
      Logger.error('BluetoothService: requestAndroidPermissions failed', err)
      return false
    }
  }

  openSettingsForState(
    bluetoothState: BluetoothState,
    platform: 'android' | 'ios'
  ): void {
    if (bluetoothState === BluetoothState.POWERED_OFF) {
      this.openSystemBluetoothSettings(platform)
      return
    }
    // Open app-specific settings so user can grant Bluetooth permission
    Linking.openSettings().catch(Logger.error)
  }
}

export default new BluetoothService()
