import React from 'react'
import { Stack } from 'new/components/navigation/Stack'

export default function TotpLayout(): JSX.Element {
  return (
    <Stack>
      <Stack.Screen name="authenticatorSetup" />
      <Stack.Screen name="scanQrCode" />
      <Stack.Screen name="copyCode" />
      <Stack.Screen name="verifyCode" />
    </Stack>
  )
}