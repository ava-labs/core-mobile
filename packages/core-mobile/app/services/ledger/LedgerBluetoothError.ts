import { Alert, Linking, Platform } from 'react-native'
import Logger from 'utils/Logger'
import { BleErrorCode, BleIOSErrorCode } from 'react-native-ble-plx'
import BluetoothService from 'services/bluetooth/BluetoothService'
import { LEDGER_ERROR_CODES } from './types'

export type BluetoothLedgerErrorCode =
  | LEDGER_ERROR_CODES.BLUETOOTH_PERMISSION
  | LEDGER_ERROR_CODES.BLUETOOTH_RADIO_OFF
  | LEDGER_ERROR_CODES.BLUETOOTH_UNSUPPORTED
  | LEDGER_ERROR_CODES.BLUETOOTH_UNKNOWN

export const LEDGER_BLUETOOTH_PERMISSION_TITLE = 'Bluetooth Permission Required'
export const LEDGER_BLUETOOTH_PERMISSION_MESSAGE =
  'Bluetooth permissions are required to connect to Ledger devices.'

export const LEDGER_BLUETOOTH_RADIO_OFF_TITLE = 'Bluetooth off'
export const LEDGER_BLUETOOTH_RADIO_OFF_MESSAGE =
  'Bluetooth is turned off. Please enable Bluetooth to connect to Ledger devices.'

export const LEDGER_BLUETOOTH_UNSUPPORTED_TITLE = 'Bluetooth unsupported'
export const LEDGER_BLUETOOTH_UNSUPPORTED_MESSAGE =
  'This device does not support Bluetooth connectivity, which is required to connect to Ledger devices.'

export const LEDGER_BLUETOOTH_UNKNOWN_TITLE = 'Bluetooth not ready'
export const LEDGER_BLUETOOTH_UNKNOWN_MESSAGE =
  'Bluetooth is not ready yet. Please wait and try again.'

export const LEDGER_CONNECTION_FAILED_TITLE = 'Connection failed'
export const LEDGER_CONNECTION_FAILED_ALREADY_CONNECTED_MESSAGE =
  'Failed to connect to your Ledger. It may already be connected to another device — try closing the Core app on other devices and reconnect.'
export const LEDGER_SCAN_FAILED_TITLE = 'Scan failed'
export const LEDGER_SCAN_FAILED_ALREADY_CONNECTED_MESSAGE =
  'Failed to scan for your Ledger. It may already be connected to another device — try closing the Core app on other devices and reconnect.'

export class LedgerBluetoothError extends Error {
  readonly code: BluetoothLedgerErrorCode

  constructor(message: string, code: BluetoothLedgerErrorCode) {
    super(message)
    this.name = 'LedgerBluetoothError'
    this.code = code
    Object.setPrototypeOf(this, LedgerBluetoothError.prototype)
  }
}

export const ledgerBluetoothErrors = {
  permissionDenied(): LedgerBluetoothError {
    return new LedgerBluetoothError(
      LEDGER_BLUETOOTH_PERMISSION_MESSAGE,
      LEDGER_ERROR_CODES.BLUETOOTH_PERMISSION
    )
  },
  radioOff(): LedgerBluetoothError {
    return new LedgerBluetoothError(
      LEDGER_BLUETOOTH_RADIO_OFF_MESSAGE,
      LEDGER_ERROR_CODES.BLUETOOTH_RADIO_OFF
    )
  },
  unsupported(): LedgerBluetoothError {
    return new LedgerBluetoothError(
      LEDGER_BLUETOOTH_UNSUPPORTED_MESSAGE,
      LEDGER_ERROR_CODES.BLUETOOTH_UNSUPPORTED
    )
  },
  unknown(): LedgerBluetoothError {
    return new LedgerBluetoothError(
      LEDGER_BLUETOOTH_UNKNOWN_MESSAGE,
      LEDGER_ERROR_CODES.BLUETOOTH_UNKNOWN
    )
  }
}

export const isLedgerBluetoothError = (
  error: unknown
): error is LedgerBluetoothError => {
  if (error instanceof LedgerBluetoothError) {
    return true
  }
  if (typeof error !== 'object' || error === null) {
    return false
  }
  const { name, code } = error as {
    name?: unknown
    code?: unknown
  }
  const bluetoothCodes: BluetoothLedgerErrorCode[] = [
    LEDGER_ERROR_CODES.BLUETOOTH_PERMISSION,
    LEDGER_ERROR_CODES.BLUETOOTH_RADIO_OFF,
    LEDGER_ERROR_CODES.BLUETOOTH_UNSUPPORTED,
    LEDGER_ERROR_CODES.BLUETOOTH_UNKNOWN
  ]
  return (
    name === 'LedgerBluetoothError' &&
    bluetoothCodes.includes(code as BluetoothLedgerErrorCode)
  )
}

export const isLedgerConnectionFailed = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errorCode' in error &&
    (error.errorCode === BleErrorCode.DeviceConnectionFailed ||
      error.errorCode === BleErrorCode.OperationTimedOut ||
      ('iosErrorCode' in error &&
        error.iosErrorCode === BleIOSErrorCode.ConnectionTimeout))
  )
}

export function showBluetoothErrorAlert(error: LedgerBluetoothError): void {
  if (error.code === LEDGER_ERROR_CODES.BLUETOOTH_PERMISSION) {
    Alert.alert(
      LEDGER_BLUETOOTH_PERMISSION_TITLE,
      LEDGER_BLUETOOTH_PERMISSION_MESSAGE,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => Linking.openSettings().catch(Logger.error)
        }
      ]
    )
    return
  }
  if (error.code === LEDGER_ERROR_CODES.BLUETOOTH_RADIO_OFF) {
    Alert.alert(
      LEDGER_BLUETOOTH_RADIO_OFF_TITLE,
      LEDGER_BLUETOOTH_RADIO_OFF_MESSAGE,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () =>
            BluetoothService.openSystemBluetoothSettings(
              Platform.OS === 'android' ? 'android' : 'ios'
            )
        }
      ]
    )
    return
  }
  if (error.code === LEDGER_ERROR_CODES.BLUETOOTH_UNSUPPORTED) {
    Alert.alert(
      LEDGER_BLUETOOTH_UNSUPPORTED_TITLE,
      LEDGER_BLUETOOTH_UNSUPPORTED_MESSAGE
    )
    return
  }
  if (error.code === LEDGER_ERROR_CODES.BLUETOOTH_UNKNOWN) {
    Logger.error('Ledger Bluetooth is in unknown state')
    Alert.alert(
      LEDGER_BLUETOOTH_UNKNOWN_TITLE,
      LEDGER_BLUETOOTH_UNKNOWN_MESSAGE
    )
  }
}
