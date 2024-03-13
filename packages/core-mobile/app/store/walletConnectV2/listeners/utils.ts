import { TransactionResponse } from 'ethers'
import { showSimpleToast } from 'components/Snackbar'
import { AppListenerEffectAPI } from 'store'
import { createPublicClient, http } from 'viem'
import { avalanche } from 'viem/chains'
import {
  ConfirmationReceiptStatus,
  Request,
  RpcMethod,
  SessionProposal
} from '../types'
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
  const publicClient = createPublicClient({
    chain: avalanche,
    transport: http()
  })

  const confirmationReceipt = await publicClient.waitForTransactionReceipt({
    hash: txResponse.hash as `0x${string}`
  })

  const status =
    confirmationReceipt?.status === ConfirmationReceiptStatus.Success
  showSimpleToast(status ? 'Transaction Confirmed' : 'Transaction Reverted')
  dispatch(
    updateRequestStatus({
      id: requestId,
      status: {
        result: {
          txHash: txResponse.hash,
          confirmationReceiptStatus: status
            ? ConfirmationReceiptStatus.Success
            : ConfirmationReceiptStatus.Revert
        }
      }
    })
  )
}
