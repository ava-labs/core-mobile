import React from 'react'
import { Stack } from '../../layouts/Stack'
import { modalScreensOptions } from '../../utils/screenOptions'

export default function SignedInLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(modals)/settings" options={modalScreensOptions} />
      <Stack.Screen name="(modals)/receive" options={modalScreensOptions} />
      <Stack.Screen
        name="(modals)/notifications"
        options={modalScreensOptions}
      />
    </Stack>
  )
}
