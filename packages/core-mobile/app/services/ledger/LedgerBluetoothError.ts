import { Alert, Linking, Platform } from 'react-native'
import Logger from 'utils/Logger'
import { openSystemBluetoothSettings } from 'common/hooks/useBluetooth'
import { LEDGER_ERROR_CODES } from './types'

const LEDGER_BLUETOOTH_PERMISSION_ERROR = 'LedgerBluetoothPermissionError'
const LEDGER_BLUETOOTH_RADIO_OFF_ERROR = 'LedgerBluetoothRadioOffError'
const LEDGER_BLUETOOTH_UNSUPPORTED_ERROR = 'LedgerBluetoothUnsupportedError'
const LEDGER_BLUETOOTH_UNKNOWN_ERROR = 'LedgerBluetoothUnknownError'

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

export class LedgerBluetoothPermissionError extends Error {
  readonly code = LEDGER_ERROR_CODES.BLUETOOTH_PERMISSION

  constructor(message = LEDGER_BLUETOOTH_PERMISSION_MESSAGE) {
    super(message)
    this.name = LEDGER_BLUETOOTH_PERMISSION_ERROR
    Object.setPrototypeOf(this, LedgerBluetoothPermissionError.prototype)
  }
}

export const isLedgerBluetoothPermissionError = (
  error: unknown
): error is LedgerBluetoothPermissionError => {
  if (error instanceof LedgerBluetoothPermissionError) {
    return true
  }
  if (
    error instanceof Error &&
    error.name === LEDGER_BLUETOOTH_PERMISSION_ERROR
  ) {
    const code = (error as Error & { code?: unknown }).code
    return code === LEDGER_ERROR_CODES.BLUETOOTH_PERMISSION
  }
  return false
}

export class LedgerBluetoothRadioOffError extends Error {
  readonly code = LEDGER_ERROR_CODES.BLUETOOTH_RADIO_OFF

  constructor(message = LEDGER_BLUETOOTH_RADIO_OFF_MESSAGE) {
    super(message)
    this.name = LEDGER_BLUETOOTH_RADIO_OFF_ERROR
    Object.setPrototypeOf(this, LedgerBluetoothRadioOffError.prototype)
  }
}

export const isLedgerBluetoothRadioOffError = (
  error: unknown
): error is LedgerBluetoothRadioOffError => {
  if (error instanceof LedgerBluetoothRadioOffError) {
    return true
  }
  if (
    error instanceof Error &&
    error.name === LEDGER_BLUETOOTH_RADIO_OFF_ERROR
  ) {
    const code = (error as Error & { code?: unknown }).code
    return code === LEDGER_ERROR_CODES.BLUETOOTH_RADIO_OFF
  }
  return false
}

export class LedgerBluetoothUnsupportedError extends Error {
  readonly code = LEDGER_ERROR_CODES.BLUETOOTH_UNSUPPORTED

  constructor(message = LEDGER_BLUETOOTH_UNSUPPORTED_MESSAGE) {
    super(message)
    this.name = LEDGER_BLUETOOTH_UNSUPPORTED_ERROR
    Object.setPrototypeOf(this, LedgerBluetoothUnsupportedError.prototype)
  }
}

export const isLedgerBluetoothUnsupportedError = (
  error: unknown
): error is LedgerBluetoothUnsupportedError => {
  if (error instanceof LedgerBluetoothUnsupportedError) {
    return true
  }
  if (
    error instanceof Error &&
    error.name === LEDGER_BLUETOOTH_UNSUPPORTED_ERROR
  ) {
    const code = (error as Error & { code?: unknown }).code
    return code === LEDGER_ERROR_CODES.BLUETOOTH_UNSUPPORTED
  }
  return false
}

export class LedgerBluetoothUnknownError extends Error {
  readonly code = LEDGER_ERROR_CODES.BLUETOOTH_UNKNOWN

  constructor(message = LEDGER_BLUETOOTH_UNKNOWN_MESSAGE) {
    super(message)
    this.name = LEDGER_BLUETOOTH_UNKNOWN_ERROR
    Object.setPrototypeOf(this, LedgerBluetoothUnknownError.prototype)
  }
}

export const isLedgerBluetoothUnknownError = (
  error: unknown
): error is LedgerBluetoothUnknownError => {
  if (error instanceof LedgerBluetoothUnknownError) {
    return true
  }
  if (error instanceof Error && error.name === LEDGER_BLUETOOTH_UNKNOWN_ERROR) {
    const code = (error as Error & { code?: unknown }).code
    return code === LEDGER_ERROR_CODES.BLUETOOTH_UNKNOWN
  }
  return false
}

type LedgerBluetoothError =
  | LedgerBluetoothPermissionError
  | LedgerBluetoothRadioOffError
  | LedgerBluetoothUnsupportedError
  | LedgerBluetoothUnknownError

export const isLedgerBluetoothError = (
  error: unknown
): error is LedgerBluetoothError => {
  return (
    isLedgerBluetoothPermissionError(error) ||
    isLedgerBluetoothRadioOffError(error) ||
    isLedgerBluetoothUnsupportedError(error) ||
    isLedgerBluetoothUnknownError(error)
  )
}

export function showBluetoothErrorAlert(error: LedgerBluetoothError): void {
  if (isLedgerBluetoothPermissionError(error)) {
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
  if (isLedgerBluetoothRadioOffError(error)) {
    Alert.alert(
      LEDGER_BLUETOOTH_RADIO_OFF_TITLE,
      LEDGER_BLUETOOTH_RADIO_OFF_MESSAGE,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () =>
            openSystemBluetoothSettings(
              Platform.OS === 'android' ? 'android' : 'ios'
            )
        }
      ]
    )
    return
  }
  if (isLedgerBluetoothUnsupportedError(error)) {
    Alert.alert(
      LEDGER_BLUETOOTH_UNSUPPORTED_TITLE,
      LEDGER_BLUETOOTH_UNSUPPORTED_MESSAGE
    )
    return
  }
  if (isLedgerBluetoothUnknownError(error)) {
    Logger.error('Ledger Bluetooth is in unknown state')
    Alert.alert(
      LEDGER_BLUETOOTH_UNKNOWN_TITLE,
      LEDGER_BLUETOOTH_UNKNOWN_MESSAGE
    )
  }
}
