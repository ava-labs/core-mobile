import { Snackbar } from '@avalabs/k2-alpine'
import React from 'react'
import { uuid } from 'utils/uuid'
import { dismissToast, showToast } from './toast'

export const showSnackbar = (message: string, toastId?: string): void => {
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
    duration: 'short',
    toastId: _toastId
  })
}
