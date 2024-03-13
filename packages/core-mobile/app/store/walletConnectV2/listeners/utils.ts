import { AppListenerEffectAPI } from 'store'
import { TransactionResponse } from 'ethers'
import { getTxConfirmationReceipt } from 'utils/getTxConfirmationReceipt'
import { showSimpleToast } from 'components/Snackbar'
import { Request, RpcMethod, SessionProposal } from '../types'
import { updateRequestStatus } from '../slice'

export const isSessionProposal = (
  request: Request
): request is SessionProposal => {
  return request.method === RpcMethod.SESSION_REQUEST
}

export const handleWaitForTransactionReceiptAsync = async (
  listenerApi: AppListenerEffectAPI,
  txResponse: TransactionResponse,
  requestId: number
): Promise<void> => {
  const { dispatch } = listenerApi

  const confirmationReceipt = await getTxConfirmationReceipt(txResponse.hash)

  const status = confirmationReceipt?.status === 'success'
  showSimpleToast(status ? 'Transaction Confirmed' : 'Transaction Reverted')
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
