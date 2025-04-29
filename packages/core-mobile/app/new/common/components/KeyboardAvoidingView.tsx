import React from 'react'
import { Platform } from 'react-native'
import {
  KeyboardAvoidingView as Component,
  KeyboardAvoidingViewProps
} from 'react-native-keyboard-controller'

export const KeyboardAvoidingView = ({
  children,
  ...props
}: KeyboardAvoidingViewProps): JSX.Element => {
  return (
    <Component
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      {...props}>
      {children}
    </Component>
  )
}
