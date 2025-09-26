import { Stack } from 'common/components/Stack'
import {
  homeScreenOptions,
  stackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import React from 'react'

export default function PortfolioLayout(): JSX.Element {
  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={homeScreenOptions} />
    </Stack>
  )
}
