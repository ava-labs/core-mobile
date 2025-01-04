import React from 'react'
import { KeyboardAvoidingView as Component, Platform } from 'react-native'

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
