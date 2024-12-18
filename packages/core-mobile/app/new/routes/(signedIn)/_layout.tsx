import React from 'react'
import { Stack } from 'new/components/navigation/Stack'
import { modalScreensOptions } from 'new/utils/navigation/screenOptions'

export default function WalletLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ animationEnabled: false }} />
      <Stack.Screen name="(modals)/settings" options={modalScreensOptions} />
      <Stack.Screen name="(modals)/receive" options={modalScreensOptions} />
      <Stack.Screen
        name="(modals)/notifications"
        options={modalScreensOptions}
      />
    </Stack>
  )
}
