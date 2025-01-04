import Toast from 'react-native-toast-notifications'
import {
  NotificationAlert,
  NotificationAlertType,
  Snackbar
} from '@avalabs/k2-alpine'
import React from 'react'
import { uuid } from 'utils/uuid'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Platform } from 'react-native'

const DURATION_SHORT = 3000
const DURATION_LONG = 5000

export const GlobalToast = (): JSX.Element => {
  const { top } = useSafeAreaInsets()
  const offsetTop = top + (Platform.OS === 'ios' ? 5 : 10)

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
          case 'snackbar':
            return (
              <Snackbar
                message={toast.data.message}
                testID="simple_toast_msg"
                onPress={() => dismissToast(toast.id)}
              />
            )
          case 'notificationAlert':
            return (
              <NotificationAlert
                type={toast.data.type}
                title={toast.data.title}
                message={toast.data.message}
                onPress={() => dismissToast(toast.id)}
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
  toastType: 'snackbar'
  toastId?: string
  content: { message: string }
}

type NotificationAlertToast = {
  toastType: 'notificationAlert'
  toastId?: string
  content: { type: NotificationAlertType; title: string; message?: string }
}

function showToast(props: SnackbarToast | NotificationAlertToast): void {
  global.toast?.hideAll()

  const _toastId = props.toastId ?? uuid()

  global?.toast?.show('', {
    type: props.toastType,
    duration: props.toastType === 'snackbar' ? DURATION_SHORT : DURATION_LONG,
    id: _toastId,
    data: props.content
  })
}

function dismissToast(toastId: string): void {
  global?.toast?.hide(toastId)
}

export function showSnackbar(message: string): void {
  showToast({
    toastType: 'snackbar',
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
    toastType: 'notificationAlert',
    content: { type, title, message }
  })
}
