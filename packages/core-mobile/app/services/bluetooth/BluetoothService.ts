import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { Linking, PermissionsAndroid, Platform } from 'react-native'
import { request, PERMISSIONS, RESULTS, check } from 'react-native-permissions'
import Logger from 'utils/Logger'
import { BluetoothAvailability, BluetoothState } from './types'
import { ANDROID_PERMISSIONS } from './consts'

export class BluetoothService {
  observeBluetoothState(onChange: (state: BluetoothState) => void): {
    unsubscribe: () => void
  } {
    return TransportBLE.observeState({
      next: (e: { type: string }) => onChange(e.type as BluetoothState),
      error: () => onChange(BluetoothState.UNKNOWN),
      complete: () => undefined
    })
  }

  async getBluetoothState(): Promise<BluetoothState> {
    return new Promise(resolve => {
      const sub = this.observeBluetoothState(state => {
        resolve(state)
        sub.unsubscribe()
      })
    })
  }

  async ensureBluetoothAvailable(): Promise<BluetoothAvailability> {
    const [state, hasPermission] = await Promise.all([
      this.getBluetoothState(),
      this.requestPermissions()
    ])
    return { hasPermission, state }
  }

  async checkIosPermissions(): Promise<boolean> {
    try {
      const status = await check(PERMISSIONS.IOS.BLUETOOTH)
      return !(status === RESULTS.BLOCKED)
    } catch (err) {
      Logger.error('BluetoothService: checkIosPermissions failed', err)
      return false
    }
  }

  // Check-only variant — never shows a dialog, safe to call from AppState listeners.
  // requestAndroidPermissions shows a system dialog which itself triggers AppState
  // changes, causing an infinite loop if called from within an AppState listener.
  async checkAndroidPermissions(): Promise<boolean[]> {
    try {
      return await Promise.all(
        ANDROID_PERMISSIONS.map(p => PermissionsAndroid.check(p))
      )
    } catch (err) {
      Logger.error('BluetoothService: checkAndroidPermissions failed', err)
      return Array(ANDROID_PERMISSIONS.length).fill(false)
    }
  }

  private async requestIOSPermissions(): Promise<boolean> {
    try {
      const checkResult = await check(PERMISSIONS.IOS.BLUETOOTH)
      if (checkResult === RESULTS.GRANTED || checkResult === RESULTS.LIMITED) {
        return true
      }
      if (checkResult === RESULTS.BLOCKED) {
        return false
      }
      const status = await request(PERMISSIONS.IOS.BLUETOOTH)
      Logger.info('BluetoothService: iOS Bluetooth permission request result', {
        status
      })
      return !(status === RESULTS.BLOCKED)
    } catch (err) {
      Logger.error('BluetoothService: requestIOSPermissions failed', err)
      return false
    }
  }

  private async requestAndroidPermissions(): Promise<boolean> {
    try {
      const checks = await this.checkAndroidPermissions()

      if (checks.every(Boolean)) return true

      const missing = ANDROID_PERMISSIONS.filter((_, i) => !checks[i])
      const granted = await PermissionsAndroid.requestMultiple(missing)

      return missing.every(
        p =>
          granted[p] === PermissionsAndroid.RESULTS.GRANTED ||
          granted[p] === PermissionsAndroid.RESULTS.DENIED // treat "denied" as granted for our purposes since it just means "ask me again next time" rather than "never ask again"
      )
    } catch (err) {
      Logger.error('BluetoothService: requestAndroidPermissions failed', err)
      return false
    }
  }

  async checkPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const checks = await this.checkAndroidPermissions()
      return checks.every(Boolean)
    }
    return await this.checkIosPermissions()
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      return await this.requestAndroidPermissions()
    }
    return await this.requestIOSPermissions()
  }

  openSystemBluetoothSettings(platform: 'android' | 'ios'): void {
    if (platform === 'android') {
      Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS').catch(
        Logger.error
      )
    } else if (platform === 'ios') {
      // 'App-Prefs:BLUETOOTH' deep-links to system Bluetooth settings on iOS < 16.
      // On iOS 16+ Apple blocked private URL schemes for third-party apps, so we
      // fall back to the app's own Settings page where the Bluetooth toggle is visible.
      Linking.openURL('App-Prefs:BLUETOOTH').catch(() =>
        Linking.openSettings().catch(Logger.error)
      )
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
