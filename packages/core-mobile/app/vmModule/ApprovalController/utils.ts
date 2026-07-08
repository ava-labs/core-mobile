import { Network } from '@avalabs/core-chains-sdk'
import { showAlert } from '@avalabs/k2-alpine'
import { RpcError, RpcMethod } from '@avalabs/vm-module-types'
import { getLedgerAppName, isBitcoinCompatibleApp } from 'features/ledger/utils'
import LedgerService from 'services/ledger/LedgerService'
import {
  LEDGER_ERROR_CODES,
  LedgerAppType,
  LEDGER_BLIND_SIGN_MESSAGE
} from 'services/ledger/types'

export const TRANSACTION_CANCELLED_BY_USER = 'Transaction cancelled by user'

export const handleLedgerErrorAndShowAlert = ({
  error,
  network,
  onRetry,
  onCancel
}: {
  error: RpcError
  network: Network
  rpcMethod?: RpcMethod
  onRetry: () => void
  onCancel: () => void
  // eslint-disable-next-line sonarjs/cognitive-complexity
}): void => {
  // @ts-ignore
  const message = error.data?.cause?.message || error.message || ''
  const lowercasedMessage = message.toLowerCase()

  const version = LedgerService.getCurrentAppVersion()
  const detectedAppType = LedgerService.getCurrentAppType()
  const ledgerAppName = getLedgerAppName(network)
  const compatible = isBitcoinCompatibleApp(detectedAppType, version)
  const unsupported =
    ledgerAppName === LedgerAppType.BITCOIN &&
    detectedAppType === LedgerAppType.BITCOIN &&
    !compatible

  const appName = unsupported ? LedgerAppType.BITCOIN_RECOVERY : ledgerAppName

  let title = 'Transaction failed'
  let description = 'An error occurred while signing the transaction.'

  if (lowercasedMessage.includes(LEDGER_ERROR_CODES.WRONG_APP)) {
    title = 'Wrong app'
    description = `Switch to the ${appName} app on your Ledger device to continue`
  } else if (
    lowercasedMessage.includes(LEDGER_ERROR_CODES.REJECTED) ||
    lowercasedMessage.includes(LEDGER_ERROR_CODES.REJECTED_ALT)
  ) {
    title = 'Transaction rejected'
    description = 'Transaction rejected by user on Ledger device.'
  } else if (
    lowercasedMessage.includes(LEDGER_ERROR_CODES.NOT_READY) ||
    lowercasedMessage.includes(LEDGER_ERROR_CODES.COMMUNICATION_ERROR)
  ) {
    title = 'App not ready'
    description = `Please ensure the ${appName} app is open and ready`
  } else if (lowercasedMessage.includes(LEDGER_ERROR_CODES.DEVICE_LOCKED)) {
    title = 'Device locked'
    description = 'Your Ledger device is locked. Please unlock it to continue.'
  } else if (lowercasedMessage.includes(LEDGER_ERROR_CODES.UPDATE_REQUIRED)) {
    title = 'Update required'
    description = `Update the ${appName} app on your Ledger device to continue`
  } else if (
    lowercasedMessage.includes(LEDGER_ERROR_CODES.USER_CANCELLED) ||
    lowercasedMessage.includes(TRANSACTION_CANCELLED_BY_USER.toLowerCase()) ||
    lowercasedMessage.includes('action cancelled by user')
  ) {
    // User cancelled, no need to show alert
    return
  } else if (
    lowercasedMessage.includes(LEDGER_ERROR_CODES.TRANSPORT_RACE_CONDITION) ||
    lowercasedMessage.includes(LEDGER_ERROR_CODES.TRANSPORT_RACE_CONDITION_ALT)
  ) {
    description =
      'Ledger is processing another request. Please try again later.'
  } else if (
    lowercasedMessage.includes(LEDGER_ERROR_CODES.BLIND_SIGN_REQUIRED) &&
    ledgerAppName === LedgerAppType.AVALANCHE &&
    detectedAppType === LedgerAppType.AVALANCHE
  ) {
    title = 'Enable blind signing'
    description = LEDGER_BLIND_SIGN_MESSAGE
  } else {
    description = message
  }

  showAlert({
    title,
    description,
    buttons: [
      { text: 'Retry', onPress: onRetry, style: 'default' },
      {
        text: 'Cancel',
        onPress: onCancel
      }
    ]
  })
}
