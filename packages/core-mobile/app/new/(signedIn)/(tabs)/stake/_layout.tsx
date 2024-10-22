import React from 'react'
import { Stack } from 'utils/navigation/Stack'
import { stackNavigatorScreenOptions } from 'utils/navigation/screenOptions'

export default function StakeLayout(): JSX.Element {
  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
