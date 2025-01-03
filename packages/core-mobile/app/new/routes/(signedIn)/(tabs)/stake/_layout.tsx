import React from 'react'
import { Stack } from 'common/components/Stack'
import {
  homeScreenOptions,
  stackNavigatorScreenOptions
} from 'common/consts/screenOptions'

export default function StakeLayout(): JSX.Element {
  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={homeScreenOptions} />
    </Stack>
  )
}
