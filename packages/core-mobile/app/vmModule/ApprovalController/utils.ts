import { Network } from '@avalabs/core-chains-sdk'
import { showAlert } from '@avalabs/k2-alpine'
import { RpcError } from '@avalabs/vm-module-types'
import { getLedgerAppName } from 'features/ledger/utils'

export const handleLedgerError = ({
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

  if (message.includes('0x6a80')) {
    title = 'Wrong app'
    description = `Switch to the ${ledgerAppName} app on your Ledger device to continue`
  } else if (message.includes('0x6985') || message.includes('0x6986')) {
    title = 'Transaction rejected'
    description = 'Transaction rejected by user on Ledger device.'
  } else if (message.includes('0x6a86')) {
    title = 'App not ready'
    description = `Please ensure the ${ledgerAppName} app is open and ready`
  } else if (message.includes('0x5515')) {
    title = 'Device locked'
    description = 'Your Ledger device is locked. Please unlock it to continue.'
  } else if (message.includes('0x6e00')) {
    title = 'Update required'
    description = `Update the ${ledgerAppName} app on your Ledger device to continue`
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
