import React from 'react'
import { ToastOptions } from 'react-native-toast-notifications/lib/typescript/toast'
import DappToast, { DappToastTypes } from './toast/DappToast'
import GeneralToast from './toast/GeneralToast'
import TransactionToast, {
  TransactionToastType
} from './toast/TransactionToast'

const LENGTH_SHORT = 3000
const LENGTH_LONG = 5000
const LENGTH_INFINITE = Number.MAX_SAFE_INTEGER

// provided by `global`. See ContextApp.tsx and index.d.ts at the root of the project.
export function ShowSnackBar(text: string | JSX.Element, long = false): string {
  return global?.toast?.show(text, {
    type: 'normal',
    placement: 'top',
    duration: long ? LENGTH_LONG : LENGTH_SHORT,
    animationType: 'slide-in',
    style: { backgroundColor: '#2A2A2D' }
  })
}

type showCustomProps = {
  component: JSX.Element
  duration: 'short' | 'long' | 'infinite'
  placement?: 'top' | 'bottom'
  id?: string
  onClose?: () => void
}

export const showDappToastError = (message: string, dappName: string): void => {
  showSnackBarCustom({
    component: (
      <DappToast
        message={message}
        dappName={dappName}
        type={DappToastTypes.ERROR}
      />
    ),
    duration: 'short'
  })
}

export const showSimpleToast = (message: string, id?: string): void => {
  showSnackBarCustom({
    component: <GeneralToast message={message} testID="simple_toast_msg" />,
    duration: 'short',
    id
  })
}

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

export function showSnackBarCustom({
  component,
  duration,
  placement = 'top',
  id,
  onClose
}: showCustomProps): string | undefined {
  const toastOptions = {
    type: 'transaction',
    placement: placement,
    animationType: 'slide-in',
    style: {
      paddingHorizontal: 0
    },
    duration:
      duration === 'infinite'
        ? LENGTH_INFINITE
        : duration === 'long'
        ? LENGTH_LONG
        : LENGTH_SHORT,
    onClose: onClose
  } as ToastOptions
  if (id) {
    // there's bug in react-native-toast-notifications which overwrites id if you pass id: undefined
    toastOptions.id = id
  }
  return global?.toast?.show(component, toastOptions)
}

export function updateSnackBarCustom(
  id: string,
  component: JSX.Element,
  long = true
): void {
  global?.toast?.update(id, component, {
    duration: long ? LENGTH_LONG : LENGTH_SHORT
  })
}
