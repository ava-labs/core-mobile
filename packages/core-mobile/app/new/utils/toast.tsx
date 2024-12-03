import { ToastOptions } from 'react-native-toast-notifications/lib/typescript/toast'
import Toast from 'react-native-toast-notifications'
import {
  NotificationAlert,
  NotificationAlertType,
  Snackbar
} from '@avalabs/k2-alpine'
import React from 'react'
import { uuid } from 'utils/uuid'

const DURATION_SHORT = 3000
const DURATION_LONG = 5000
const DURATION_INFINITE = Number.MAX_SAFE_INTEGER

export function showToast({
  component,
  duration,
  toastId,
  onClose
}: {
  component: JSX.Element
  duration: 'short' | 'long' | 'infinite'
  toastId: string
  onClose?: () => void
}): string | undefined {
  const toastOptions = {
    type: 'transaction',
    placement: 'top',
    animationType: 'slide-in',
    duration:
      duration === 'infinite'
        ? DURATION_INFINITE
        : duration === 'long'
        ? DURATION_LONG
        : DURATION_SHORT,
    onClose,
    offset: 1000,
    id: toastId
  } as ToastOptions

  return global?.toast?.show(component, toastOptions)
}

export function dismissToast(toastId: string): void {
  global?.toast?.hide(toastId)
}

export function renderToast(): JSX.Element {
  return (
    <Toast
      ref={ref => {
        if (ref) {
          global.toast = ref
        }
      }}
      offsetTop={46}
      style={{ padding: 0 }}
      normalColor="transparent"
    />
  )
}

export const showSnackbar = ({
  message,
  toastId
}: {
  message: string
  toastId?: string
}): void => {
  const _toastId = toastId ?? uuid()

  const handlePress = (): void => {
    dismissToast(_toastId)
  }

  showToast({
    component: (
      <Snackbar
        message={message}
        testID="simple_toast_msg"
        onPress={handlePress}
      />
    ),
    duration: 'infinite',
    toastId: _toastId
  })
}

export const showNotificationAlert = ({
  type,
  title,
  message,
  toastId
}: {
  type: NotificationAlertType
  title: string
  message?: string
  toastId?: string
}): void => {
  const _toastId = toastId ?? uuid()

  const handlePress = (): void => {
    dismissToast(_toastId)
  }

  showToast({
    component: (
      <NotificationAlert
        type={type}
        title={title}
        message={message}
        testID="notification_alert"
        onPress={handlePress}
      />
    ),
    duration: 'infinite',
    toastId: _toastId
  })
}
