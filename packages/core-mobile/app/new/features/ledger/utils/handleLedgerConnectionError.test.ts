import { Alert, Linking } from 'react-native'
import { handleLedgerConnectionError } from './handleLedgerConnectionError'

jest.mock('utils/Logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}))

jest.mock('services/ledger/LedgerBluetoothPermissionError', () => ({
  isLedgerBluetoothPermissionError: jest.fn()
}))

const Logger = require('utils/Logger')
const {
  isLedgerBluetoothPermissionError
} = require('services/ledger/LedgerBluetoothPermissionError')

describe('handleLedgerConnectionError', () => {
  let alertSpy: jest.SpyInstance
  let resetStep: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    resetStep = jest.fn()
  })

  afterEach(() => {
    alertSpy.mockRestore()
  })

  it('logs the error with the app name', () => {
    isLedgerBluetoothPermissionError.mockReturnValue(false)
    const err = new Error('test error')

    handleLedgerConnectionError(err, 'Avalanche', resetStep)

    expect(Logger.error).toHaveBeenCalledWith(
      'Failed to connect to Avalanche app',
      err
    )
  })

  it('calls the resetStep callback', () => {
    isLedgerBluetoothPermissionError.mockReturnValue(false)

    handleLedgerConnectionError(new Error(), 'Avalanche', resetStep)

    expect(resetStep).toHaveBeenCalledTimes(1)
  })

  it('shows Bluetooth permission alert for bluetooth errors', () => {
    isLedgerBluetoothPermissionError.mockReturnValue(true)

    handleLedgerConnectionError(new Error(), 'Avalanche', resetStep)

    expect(alertSpy).toHaveBeenCalledTimes(1)
    expect(alertSpy).toHaveBeenCalledWith(
      'Bluetooth Permission Required',
      expect.stringContaining('Bluetooth permissions'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Open Settings' })
      ])
    )
  })

  it('opens device settings when Open Settings is pressed', () => {
    isLedgerBluetoothPermissionError.mockReturnValue(true)
    const linkingSpy = jest
      .spyOn(Linking, 'openSettings')
      .mockImplementation(jest.fn() as any)

    handleLedgerConnectionError(new Error(), 'Avalanche', resetStep)

    const buttons = alertSpy.mock.calls[0][2]
    const openSettingsButton = buttons.find(
      (b: { text: string }) => b.text === 'Open Settings'
    )
    openSettingsButton.onPress()

    expect(linkingSpy).toHaveBeenCalled()
    linkingSpy.mockRestore()
  })

  it('shows generic connection failed alert for non-bluetooth errors', () => {
    isLedgerBluetoothPermissionError.mockReturnValue(false)

    handleLedgerConnectionError(new Error(), 'Avalanche', resetStep)

    expect(alertSpy).toHaveBeenCalledTimes(1)
    expect(alertSpy).toHaveBeenCalledWith(
      'Connection Failed',
      expect.stringContaining('Avalanche app'),
      expect.arrayContaining([expect.objectContaining({ text: 'OK' })])
    )
  })

  it('includes "installed and" in Solana failure message', () => {
    isLedgerBluetoothPermissionError.mockReturnValue(false)

    handleLedgerConnectionError(new Error(), 'Solana', resetStep)

    expect(alertSpy).toHaveBeenCalledWith(
      'Connection Failed',
      expect.stringContaining('installed and open'),
      expect.any(Array)
    )
  })

  it('does not include "installed and" for non-Solana apps', () => {
    isLedgerBluetoothPermissionError.mockReturnValue(false)

    handleLedgerConnectionError(new Error(), 'Avalanche', resetStep)

    const message = alertSpy.mock.calls[0][1]
    expect(message).not.toContain('installed and')
  })
})
