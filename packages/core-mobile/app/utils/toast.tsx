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

export const showTransactionSuccessToast = ({
  message,
  txHash,
  testID
}: {
  message: string
  txHash?: string
  testID?: string
}): void => {
  showSnackBarCustom({
    component: (
      <TransactionToast
        testID={testID}
        message={message}
        type={TransactionToastType.SUCCESS}
        txHash={txHash}
      />
    ),
    duration: 'long'
  })
}

export const showTransactionErrorToast = ({
  message
}: {
  message: string
}): void => {
  showSnackBarCustom({
    component: (
      <TransactionToast message={message} type={TransactionToastType.ERROR} />
    ),
    duration: 'long'
  })
}
