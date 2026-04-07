import { Alert, Linking } from 'react-native'
import { isLedgerBluetoothPermissionError } from 'services/ledger/LedgerBluetoothPermissionError'
import Logger from 'utils/Logger'

/**
 * Shared error handler for Ledger app connection failures.
 * Logs the error, resets the connection step, and shows the appropriate alert
 * (Bluetooth permission or generic connection failure).
 */
export function handleLedgerConnectionError(
  err: unknown,
  appName: string,
  resetStep: () => void
): void {
  Logger.error(`Failed to connect to ${appName} app`, err)
  resetStep()

  if (isLedgerBluetoothPermissionError(err)) {
    Alert.alert(
      'Bluetooth Permission Required',
      'Please enable Bluetooth permissions in your device settings to connect to Ledger devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    )
    return
  }

  const installedPrefix = appName === 'Solana' ? 'installed and ' : ''
  Alert.alert(
    'Connection Failed',
    `Failed to connect to ${appName} app. Please make sure the ${appName} app is ${installedPrefix}open on your Ledger.`,
    [{ text: 'OK' }]
  )
}
