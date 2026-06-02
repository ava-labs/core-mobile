import { Stack } from 'common/components/Stack'
import { modalStackNavigatorScreenOptions } from 'common/consts/screenOptions'
import React from 'react'

export default function PerpetualsSearchLayout(): JSX.Element {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  )
}
