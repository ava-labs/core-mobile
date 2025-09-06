import {
  NotificationAlert,
  NotificationAlertType,
  showAlert,
  Snackbar,
  TransactionSnackbar
} from '@avalabs/k2-alpine'
import React from 'react'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FullWindowOverlay } from 'react-native-screens'
import Toast from 'react-native-toast-notifications'
import { uuid } from 'utils/uuid'
import { useCoreBrowser } from '../hooks/useCoreBrowser'

const DURATION_INDEFINITE = 0 // 0 means indefinite in react-native-toast-notifications
const DURATION_SHORT = 3000
const DURATION_LONG = 6000

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
      ToastContainerWrapper={{
        component: FullWindowOverlay,
        props: { children: undefined }
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
          case ToastType.TRANSACTION_SNACKBAR: {
            const isActionable =
              toast.data.type === 'success' && toast.data.explorerLink
                ? true
                : toast.data.type === 'error' && toast.data.error
                ? true
                : false

            const onPress = (): void => {
              dismissToast(toast.id)

              if (!isActionable) return

              if (toast.data.type === 'success') {
                openUrl({
                  url: toast.data.explorerLink,
                  title: 'Transaction Details'
                })
              } else if (toast.data.type === 'error') {
                showAlert({
                  title: 'Error details',
                  description: toast.data.error,
                  buttons: [
                    {
                      text: 'Got it'
                    }
                  ]
                })
              }
            }

            return (
              <TransactionSnackbar
                message={toast.data.message}
                type={toast.data.type}
                isActionable={isActionable}
                onPress={onPress}
              />
            )
          }
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

const getDuration = (props: ToastProps, config?: ToastConfig): number => {
  return config && 'duration' in config && typeof config.duration === 'number'
    ? config.duration
    : props.toastType === ToastType.SNACKBAR
    ? DURATION_SHORT
    : DURATION_LONG
}

function showToast(props: ToastProps, config?: ToastConfig): void {
  global.toast?.hideAll()

  const _toastId = props.toastId ?? uuid()

  const duration = getDuration(props, config)

  global?.toast?.show('', {
    type: props.toastType,
    duration,
    id: _toastId,
    data: props.content
  })
}

function updateToast({
  toastId,
  props,
  config
}: {
  toastId: string
  props: ToastProps
  config?: ToastConfig
}): void {
  const duration = getDuration(props, config)

  global?.toast?.update(toastId, '', {
    type: props.toastType,
    duration,
    id: toastId,
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
  pending: ({ toastId, message }: { toastId?: string; message?: string }) =>
    showToast(
      {
        toastId,
        toastType: ToastType.TRANSACTION_SNACKBAR,
        content: { type: 'pending', message }
      },
      {
        duration: DURATION_INDEFINITE
      }
    ),
  /*
   * Displays a success snackbar.
   *
   * `message` is a short, one-line message for the snackbar.
   * `explorerLink` is an optional link to a blockchain explorer or related page.
   */
  success: ({
    toastId,
    message,
    explorerLink
  }: {
    toastId?: string
    message?: string
    explorerLink?: string
  }) => {
    const props: ToastProps = {
      toastType: ToastType.TRANSACTION_SNACKBAR,
      content: { type: 'success', explorerLink, message }
    }
    if (toastId) {
      updateToast({
        toastId,
        props
      })
    } else {
      showToast(props)
    }
  },
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
