import React from 'react'
import { AppListenerEffectAPI } from 'store'
import { TransactionResponse } from 'ethers'
import { getTxConfirmationReceipt } from 'utils/getTxConfirmationReceipt'
import { showSnackBarCustom } from 'components/Snackbar'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectActiveNetwork } from 'store/network'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import { updateRequestStatus } from '../slice'

export const handleWaitForTransactionReceipt = async (
  listenerApi: AppListenerEffectAPI,
  txResponse: TransactionResponse,
  requestId: number
): Promise<void> => {
  const { dispatch, getState } = listenerApi
  const state = getState()
  const network = selectActiveNetwork(state)
  const isTestnet = selectIsDeveloperMode(state)

  showSnackBarCustom({
    component: (
      <TransactionToast
        message={'Transaction Pending...'}
        type={TransactionToastType.PENDING}
      />
    ),
    duration: 'short'
  })

  const confirmationReceipt = await getTxConfirmationReceipt(
    txResponse.hash,
    network,
    isTestnet
  )

  const status = confirmationReceipt?.status === 'success'

  if (status) {
    showSnackBarCustom({
      component: (
        <TransactionToast
          message={'Transaction Successful'}
          type={TransactionToastType.SUCCESS}
          txHash={txResponse.hash}
        />
      ),
      duration: 'long'
    })
  } else {
    showSnackBarCustom({
      component: (
        <TransactionToast
          message={'Transaction Reverted'}
          type={TransactionToastType.ERROR}
        />
      ),
      duration: 'long'
    })
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
