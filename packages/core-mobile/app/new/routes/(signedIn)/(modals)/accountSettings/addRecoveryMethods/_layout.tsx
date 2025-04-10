import React from 'react'
import { Stack } from 'common/components/Stack'
import { SeedlessManageRecoveryMethodsProvider } from 'features/accountSettings/context/SeedlessManageRecoveryMethodsProvider'

export default function AddRecoveryMethodsLayout(): JSX.Element {
  return (
    <SeedlessManageRecoveryMethodsProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="available" />
        <Stack.Screen name="(fido)" />
        <Stack.Screen name="(totp)" />
        <Stack.Screen name="verifyMfa" />
      </Stack>
    </SeedlessManageRecoveryMethodsProvider>
  )
}
