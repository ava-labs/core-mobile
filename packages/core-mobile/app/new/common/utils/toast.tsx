import Toast from 'react-native-toast-notifications'
import {
  NotificationAlert,
  NotificationAlertType,
  showAlert,
  Snackbar,
  TransactionSnackbar
} from '@avalabs/k2-alpine'
import React from 'react'
import { uuid } from 'utils/uuid'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Platform } from 'react-native'
import { useCoreBrowser } from '../hooks/useCoreBrowser'

const DURATION_SHORT = 3000
const DURATION_LONG = 5000

export enum ToastType {
  SNACKBAR = 'snackbar',
  NOTIFICATION_ALERT = 'notificationAlert',
  TRANSACTION_SNACKBAR = 'transactionSnackbar'
}

export const GlobalToast = (): JSX.Element => {
  const { top } = useSafeAreaInsets()
  const offsetTop = top + (Platform.OS === 'ios' ? 5 : 10)
  const { openUrl } = useCoreBrowser()

  return (
    <Toast
      ref={ref => {
        if (ref) {
          global.toast = ref
        }
      }}
      placement="top"
      animationType="slide-in"
      offsetTop={offsetTop}
      renderToast={toast => {
        switch (toast.type) {
          case ToastType.SNACKBAR:
            return (
              <Snackbar
                message={toast.data.message}
                testID="simple_toast_msg"
                onPress={() => dismissToast(toast.id)}
              />
            )
          case ToastType.NOTIFICATION_ALERT:
            return (
              <NotificationAlert
                type={toast.data.type}
                title={toast.data.title}
                message={toast.data.message}
                onPress={() => dismissToast(toast.id)}
              />
            )
          case ToastType.TRANSACTION_SNACKBAR:
            return (
              <TransactionSnackbar
                type={toast.data.type}
                onPress={() => {
                  dismissToast(toast.id)
                  if (toast.data.type === 'success') {
                    openUrl({
                      url: `https://explorer.avax.network/tx/${toast.data.txHash}`,
                      title: 'Transaction'
                    })
                  } else if (toast.data.type === 'error') {
                    showAlert({
                      title: 'Some error message',
                      description: 'This action can’t be undone',
                      buttons: [
                        {
                          text: 'Got it'
                        }
                      ]
                    })
                  }
                }}
              />
            )
          default:
            throw new Error('Invalid toast type')
        }
      }}
    />
  )
}

type SnackbarToast = {
  toastType: ToastType.SNACKBAR
  toastId?: string
  content: { message: string }
}

type NotificationAlertToast = {
  toastType: ToastType.NOTIFICATION_ALERT
  toastId?: string
  content: { type: NotificationAlertType; title: string; message?: string }
}

type TransactionSnackbarToast =
  | {
      toastType: ToastType.TRANSACTION_SNACKBAR
      toastId?: string
      content: { type: 'pending' }
    }
  | {
      toastType: ToastType.TRANSACTION_SNACKBAR
      toastId?: string
      content: { type: 'success'; txHash: string }
    }
  | {
      toastType: ToastType.TRANSACTION_SNACKBAR
      toastId?: string
      content: { type: 'error'; error: string }
    }

type ToastProps =
  | SnackbarToast
  | NotificationAlertToast
  | TransactionSnackbarToast

type ToastConfig = {
  duration?: number
}

function showToast(props: ToastProps, config?: ToastConfig): void {
  global.toast?.hideAll()

  const _toastId = props.toastId ?? uuid()

  const duration = config?.duration
    ? config.duration
    : props.toastType === ToastType.SNACKBAR
    ? DURATION_SHORT
    : DURATION_LONG

  global?.toast?.show('', {
    type: props.toastType,
    duration,
    id: _toastId,
    data: props.content
  })
}

function dismissToast(toastId: string): void {
  global?.toast?.hide(toastId)
}

export function showSnackbar(message: string): void {
  showToast({
    toastType: ToastType.SNACKBAR,
    content: { message }
  })
}

export function showNotificationAlert({
  type,
  title,
  message
}: {
  type: NotificationAlertType
  title: string
  message?: string
}): void {
  showToast({
    toastType: ToastType.NOTIFICATION_ALERT,
    content: { type, title, message }
  })
}

export function showPendingTransactionSnackbar(): void {
  showToast(
    {
      toastType: ToastType.TRANSACTION_SNACKBAR,
      content: { type: 'pending' }
    },
    {
      duration: DURATION_SHORT
    }
  )
}

export function showSuccessTransactionSnackbar(txHash: string): void {
  showToast({
    toastType: ToastType.TRANSACTION_SNACKBAR,
    content: { type: 'success', txHash }
  })
}

export function showErrorTransactionSnackbar(error: string): void {
  showToast({
    toastType: ToastType.TRANSACTION_SNACKBAR,
    content: { type: 'error', error }
  })
}
