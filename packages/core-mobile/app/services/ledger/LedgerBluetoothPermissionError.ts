import { LEDGER_ERROR_CODES } from './types'

export const LEDGER_BLUETOOTH_PERMISSION_MESSAGE =
  'Bluetooth permissions are required to connect to Ledger devices.'

export class LedgerBluetoothPermissionError extends Error {
  readonly code = LEDGER_ERROR_CODES.BLUETOOTH_PERMISSION

  constructor(message = LEDGER_BLUETOOTH_PERMISSION_MESSAGE) {
    super(message)
    this.name = 'LedgerBluetoothPermissionError'
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
    error.name === 'LedgerBluetoothPermissionError'
  ) {
    const code = (error as Error & { code?: unknown }).code
    return code === LEDGER_ERROR_CODES.BLUETOOTH_PERMISSION
  }
  return false
}

export const LEDGER_BLUETOOTH_RADIO_OFF_MESSAGE =
  'Bluetooth is turned off. Please enable Bluetooth to connect to Ledger devices.'

export class LedgerBluetoothRadioOffError extends Error {
  readonly code = LEDGER_ERROR_CODES.BLUETOOTH_RADIO_OFF

  constructor(message = LEDGER_BLUETOOTH_RADIO_OFF_MESSAGE) {
    super(message)
    this.name = 'LedgerBluetoothRadioOffError'
    Object.setPrototypeOf(this, LedgerBluetoothRadioOffError.prototype)
  }
}

export const isLedgerBluetoothRadioOffError = (
  error: unknown
): error is LedgerBluetoothRadioOffError => {
  if (error instanceof LedgerBluetoothRadioOffError) {
    return true
  }
  if (error instanceof Error && error.name === 'LedgerBluetoothRadioOffError') {
    const code = (error as Error & { code?: unknown }).code
    return code === LEDGER_ERROR_CODES.BLUETOOTH_RADIO_OFF
  }
  return false
}
