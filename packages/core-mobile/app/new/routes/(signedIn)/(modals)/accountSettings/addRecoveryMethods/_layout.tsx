import { Stack } from 'common/components/Stack'
import { RecoverMethodsProvider } from 'features/accountSettings/context/RecoverMethodsProvider'
import React from 'react'

export default function AddRecoveryMethodsLayout(): JSX.Element {
  return (
    <RecoverMethodsProvider>
      <Stack
        screenOptions={{
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
