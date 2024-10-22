import React from 'react'
import { Stack } from 'utils/navigation/Stack'
import {
  homeScreenOptions,
  stackNavigatorScreenOptions
} from 'utils/navigation/screenOptions'

export default function PortfolioLayout(): JSX.Element {
  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={homeScreenOptions} />
      <Stack.Screen name="assets" />
    </Stack>
  )
}
