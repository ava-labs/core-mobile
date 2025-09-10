import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import React from 'react'

export default function ManageNetworksLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        ...stackNavigatorScreenOptions,
        headerShown: false
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="addCustomNetwork" />
    </Stack>
  )
}
