import React from 'react'
import { Stack } from 'new/components/navigation/Stack'
import {
  homeScreenOptions,
  stackNavigatorScreenOptions
} from 'new/utils/navigation/screenOptions'

export default function BrowserLayout(): JSX.Element {
  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={homeScreenOptions} />
    </Stack>
  )
}
