import React from 'react'
import { Stack } from 'new/components/navigation/Stack'

export default function AuthenticatorSetupLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="passkey" />
      <Stack.Screen name="yubikey" />
      <Stack.Screen name="totp" />
    </Stack>
  )
}
