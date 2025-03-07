import React from 'react'
import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'

export default function NoTabsLayout(): JSX.Element {
  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="defiDetail" />
      <Stack.Screen name="tokenDetail" />
    </Stack>
  )
}
