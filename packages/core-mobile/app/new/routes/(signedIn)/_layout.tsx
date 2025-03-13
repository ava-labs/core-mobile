import React from 'react'
import { Stack } from 'common/components/Stack'
import { modalScreensOptions } from 'common/consts/screenOptions'

export default function WalletLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      <Stack.Screen name="(modals)/settings" options={modalScreensOptions} />
      <Stack.Screen name="(modals)/receive" options={modalScreensOptions} />
      <Stack.Screen
        name="(modals)/notifications"
        options={modalScreensOptions}
      />
      <Stack.Screen
        name="(modals)/tokenManagement"
        options={modalScreensOptions}
      />
      <Stack.Screen
        name="(modals)/trackTokenDetail"
        options={modalScreensOptions}
      />
      <Stack.Screen
        name="(modals)/collectibleManagement"
        options={modalScreensOptions}
      />
    </Stack>
  )
}
