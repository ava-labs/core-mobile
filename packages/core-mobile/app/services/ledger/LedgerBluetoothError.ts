import { Alert, Linking, Platform } from 'react-native'
import Logger from 'utils/Logger'
import BluetoothService from 'services/bluetooth/BluetoothService'
import { LEDGER_ERROR_CODES } from './types'

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

export class LedgerBluetoothError extends Error {
  readonly code: LEDGER_ERROR_CODES

  constructor(message: string, code: LEDGER_ERROR_CODES) {
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
  return (
    name === 'LedgerBluetoothError' &&
    Object.values(LEDGER_ERROR_CODES).includes(code as LEDGER_ERROR_CODES)
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
