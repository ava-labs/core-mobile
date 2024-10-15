import React from 'react'
import { Stack } from '../../../../layouts/Stack'
import { stackNavigatorScreenOptions } from '../../../../utils/screenOptions'

export default function PortfolioLayout(): JSX.Element {
  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="assets" />
    </Stack>
  )
}
