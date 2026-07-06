import React from 'react'
import { View } from '../Primitives'
import { useTheme } from '../../hooks'
import { SplitButton } from './SplitButton'

export default {
  title: 'SplitButton'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.$surfacePrimary,
        padding: 16,
        gap: 24
      }}>
      <SplitButton
        left={{
          children: 'Pause recurrence',
          onPress: () => undefined
        }}
        right={{
          children: 'Cancel',
          onPress: () => undefined,
          textStyle: { color: theme.colors.$textDanger }
        }}
      />
      <SplitButton
        left={{
          children: 'Resume recurrence',
          onPress: () => undefined
        }}
        right={{
          children: 'Cancel',
          onPress: () => undefined,
          disabled: true,
          textStyle: { color: theme.colors.$textDanger }
        }}
      />
      <SplitButton
        size="medium"
        type="primary"
        left={{ children: 'Approve', onPress: () => undefined }}
        right={{ children: 'Reject', onPress: () => undefined }}
      />
    </View>
  )
}
