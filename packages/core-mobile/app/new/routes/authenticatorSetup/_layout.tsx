import React from 'react'
import { Stack } from 'new/components/navigation/Stack'
import { TotpProvider } from 'new/contexts/TotpProvider'

export default function AuthenticatorSetupLayout(): JSX.Element {
  return (
    <TotpProvider>
      <Stack>
        <Stack.Screen name="authenticatorSetup" />
        <Stack.Screen name="scanQrCode" />
        <Stack.Screen name="copyCode" />
        <Stack.Screen name="verifyCode" />
      </Stack>
    </TotpProvider>
  )
}
