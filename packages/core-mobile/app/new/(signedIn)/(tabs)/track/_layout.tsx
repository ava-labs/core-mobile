import React from 'react'
import { Stack } from 'utils/navigation/Stack'
import { stackNavigatorScreenOptions } from 'utils/navigation/screenOptions'

export default function TrackLayout(): JSX.Element {
  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
