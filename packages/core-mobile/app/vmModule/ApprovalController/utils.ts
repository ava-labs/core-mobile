import { Network } from '@avalabs/core-chains-sdk'
import { showAlert } from '@avalabs/k2-alpine'
import { RpcError } from '@avalabs/vm-module-types'
import { getLedgerAppName } from 'features/ledger/utils'
import { LEDGER_ERROR_CODES } from 'services/ledger/types'

export const handleLedgerErrorAndShowAlert = ({
  error,
  network,
  onRetry,
  onCancel
}: {
  error: RpcError
  network: Network
  onRetry: () => void
  onCancel: () => void
}): void => {
  // @ts-ignore
  const message = (error.data?.cause?.message || '').toLowerCase()

  const ledgerAppName = getLedgerAppName(network)

  let title = 'Transaction failed'
  let description = 'An error occurred while signing the transaction.'

  if (message.includes(LEDGER_ERROR_CODES.WRONG_APP)) {
    title = 'Wrong app'
    description = `Switch to the ${ledgerAppName} app on your Ledger device to continue`
  } else if (
    message.includes(LEDGER_ERROR_CODES.REJECTED) ||
    message.includes(LEDGER_ERROR_CODES.REJECTED_ALT)
  ) {
    title = 'Transaction rejected'
    description = 'Transaction rejected by user on Ledger device.'
  } else if (message.includes(LEDGER_ERROR_CODES.NOT_READY)) {
    title = 'App not ready'
    description = `Please ensure the ${ledgerAppName} app is open and ready`
  } else if (message.includes(LEDGER_ERROR_CODES.DEVICE_LOCKED)) {
    title = 'Device locked'
    description = 'Your Ledger device is locked. Please unlock it to continue.'
  } else if (message.includes(LEDGER_ERROR_CODES.UPDATE_REQUIRED)) {
    title = 'Update required'
    description = `Update the ${ledgerAppName} app on your Ledger device to continue`
  } else if (message.includes(LEDGER_ERROR_CODES.USER_CANCELLED)) {
    // User cancelled, no need to show alert
    return
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
