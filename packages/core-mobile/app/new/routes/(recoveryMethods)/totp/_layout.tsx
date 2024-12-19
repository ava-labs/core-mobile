import React from 'react'
import { Stack } from 'new/components/navigation/Stack'
import { SignupProvider } from 'new/contexts/SignupProvider'

export default function TotpLayout(): JSX.Element {
  return (
    <SignupProvider>
      <Stack>
        <Stack.Screen name="authenticatorSetup" />
        <Stack.Screen name="scanQrCode" />
        <Stack.Screen name="copyCode" />
        <Stack.Screen name="verifyCode" />
      </Stack>
    </SignupProvider>
  )
}
