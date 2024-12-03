import { ToastOptions } from 'react-native-toast-notifications/lib/typescript/toast'
import Toast from 'react-native-toast-notifications'
import React from 'react'

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
      normalColor="transparent"
    />
  )
}

const DURATION_SHORT = 3000
const DURATION_LONG = 5000
const DURATION_INFINITE = Number.MAX_SAFE_INTEGER
