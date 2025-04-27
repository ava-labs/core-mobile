import React from 'react'
import { Platform } from 'react-native'
import { KeyboardAvoidingView as Component } from 'react-native-keyboard-controller'

export const KeyboardAvoidingView = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => {
  return (
    <Component
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {children}
    </Component>
  )
}
