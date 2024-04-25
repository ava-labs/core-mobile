import { AppListenerEffectAPI } from 'store'
import { TransactionResponse } from 'ethers'
import { getTxConfirmationReceipt } from 'utils/getTxConfirmationReceipt'
import {
  showTransactionPendingToast,
  showTransactionErrorToast,
  showTransactionSuccessToast
} from 'utils/toast'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { selectActiveNetwork } from 'store/network/slice'
import { Network } from '@avalabs/chains-sdk'
import { updateRequestStatus } from '../slice'

export const handleWaitForTransactionReceipt = async (
  listenerApi: AppListenerEffectAPI,
  txResponse: TransactionResponse,
  requestId: number,
  requestedNetwork?: Network
): Promise<void> => {
  const { dispatch, getState } = listenerApi
  const state = getState()
  const network = requestedNetwork ?? selectActiveNetwork(state)
  const isTestnet = selectIsDeveloperMode(state)

  showTransactionPendingToast()

  const confirmationReceipt = await getTxConfirmationReceipt(
    txResponse.hash,
    network,
    isTestnet
  )

  const status = confirmationReceipt?.status === 'success'

  if (status) {
    showTransactionSuccessToast({
      message: 'Transaction Successful',
      txHash: txResponse.hash
    })
  } else {
    showTransactionErrorToast({ message: 'Transaction Reverted' })
  }

  dispatch(
    updateRequestStatus({
      id: requestId,
      status: {
        result: {
          txHash: txResponse.hash,
          confirmationReceiptStatus: status ? 'Success' : 'Reverted'
        }
      }
    })
  )
}
