import { Stack } from 'common/components/Stack'
import { modalStackNavigatorScreenOptions } from 'common/consts/screenOptions'
import React from 'react'

export default function SelectSwapToTokenLayout(): JSX.Element {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
