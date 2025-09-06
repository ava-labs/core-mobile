import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { RecoverMethodsProvider } from 'features/accountSettings/context/RecoverMethodsProvider'
import React from 'react'

export default function AddRecoveryMethodsLayout(): JSX.Element {
  return (
    <RecoverMethodsProvider>
      <Stack
        screenOptions={{
          ...stackNavigatorScreenOptions,
          headerShown: false
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="available" />
        <Stack.Screen name="(fido)" />
        <Stack.Screen name="(totp)" />
        <Stack.Screen name="verifyMfa" />
      </Stack>
    </RecoverMethodsProvider>
  )
}
