import React from 'react'
import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'

export default function TotpLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        ...stackNavigatorScreenOptions,
        headerShown: false
      }}>
      <Stack.Screen name="authenticatorSetup" />
      <Stack.Screen name="scanQrCode" />
      <Stack.Screen name="copyCode" />
      <Stack.Screen name="verifyCode" />
    </Stack>
  )
}
