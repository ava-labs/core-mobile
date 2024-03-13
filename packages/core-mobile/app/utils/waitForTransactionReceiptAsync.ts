import { showSimpleToast } from 'components/Snackbar'
import { TransactionResponse } from 'ethers'
import { AppListenerEffectAPI } from 'store'
import {
  ConfirmationReceiptStatus,
  updateRequestStatus
} from 'store/walletConnectV2'
import { createPublicClient, http } from 'viem'
import { avalanche } from 'viem/chains'

export const waitForTransactionReceiptAsync = async (
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
