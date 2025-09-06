import React from 'react'
import { Stack } from 'common/components/Stack'
import {
  stackNavigatorScreenOptions,
  stackScreensOptions
} from 'common/consts/screenOptions'

export default function StakeDetailLayout(): JSX.Element {
  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={stackScreensOptions} />
    </Stack>
  )
}
