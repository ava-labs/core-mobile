import React from 'react'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'

export const showTransactionPendingToast = (): void => {
  showSnackBarCustom({
    component: (
      <TransactionToast
        message={'Transaction Pending...'}
        type={TransactionToastType.PENDING}
      />
    ),
    duration: 'short'
  })
}

export const showTransactionSuccessToast = (txHash: string): void => {
  showSnackBarCustom({
    component: (
      <TransactionToast
        message={'Transaction Successful'}
        type={TransactionToastType.SUCCESS}
        txHash={txHash}
      />
    ),
    duration: 'long'
  })
}

export const showTransactionRevertedToast = (): void => {
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
