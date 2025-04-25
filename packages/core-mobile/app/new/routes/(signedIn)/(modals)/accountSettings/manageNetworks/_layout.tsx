import React from 'react'
import { Stack } from 'common/components/Stack'

export default function ManageNetworksLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="addCustomNetwork" />
    </Stack>
  )
}
