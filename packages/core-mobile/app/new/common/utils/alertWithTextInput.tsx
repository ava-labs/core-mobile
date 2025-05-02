import { AlertWithTextInputs, NotificationAlertType } from '@avalabs/k2-alpine'
import React from 'react'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { uuid } from 'utils/uuid'
import { useCoreBrowser } from '../hooks/useCoreBrowser'

const DURATION_SHORT = 3000
const DURATION_LONG = 6000

export enum ToastType {
  SNACKBAR = 'snackbar',
  NOTIFICATION_ALERT = 'notificationAlert',
  TRANSACTION_SNACKBAR = 'transactionSnackbar'
}

export const GlobalAlertWithTextInput = (): JSX.Element => {
  const { top } = useSafeAreaInsets()
  const offsetTop = top + (Platform.OS === 'ios' ? 5 : 10)
  const { openUrl } = useCoreBrowser()

  return (
    <AlertWithTextInputs
      ref={ref => {
        if (ref) {
          global.alert = ref
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
      content: { type: 'pending'; message?: string }
    }
  | {
      toastType: ToastType.TRANSACTION_SNACKBAR
      toastId?: string
      content: { type: 'success'; message?: string; explorerLink?: string }
    }
  | {
      toastType: ToastType.TRANSACTION_SNACKBAR
      toastId?: string
      content: { type: 'error'; message?: string; error?: string }
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

export const transactionSnackbar = {
  /*
   * Displays a pending snackbar with a short duration.
   */
  pending: () =>
    showToast(
      {
        toastType: ToastType.TRANSACTION_SNACKBAR,
        content: { type: 'pending' }
      },
      {
        duration: DURATION_SHORT
      }
    ),
  /*
   * Displays a success snackbar.
   *
   * `message` is a short, one-line message for the snackbar.
   * `explorerLink` is an optional link to a blockchain explorer or related page.
   */
  success: ({
    message,
    explorerLink
  }: {
    message?: string
    explorerLink?: string
  }) =>
    showToast(
      {
        toastType: ToastType.TRANSACTION_SNACKBAR,
        content: { type: 'success', explorerLink, message }
      },
      {
        duration: DURATION_LONG
      }
    ),
  /*
   * Displays an error snackbar.
   *
   * `message` is a short, one-line message for the snackbar.
   * `error` is the detailed error message shown in an alert when the user clicks on the snackbar.
   */
  error: ({ error, message }: { error?: string; message?: string }) =>
    showToast(
      {
        toastType: ToastType.TRANSACTION_SNACKBAR,
        content: { type: 'error', error, message }
      },
      {
        duration: DURATION_LONG
      }
    )
}
