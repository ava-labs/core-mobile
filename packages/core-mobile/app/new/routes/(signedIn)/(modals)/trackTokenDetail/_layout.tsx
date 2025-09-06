import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  stackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import React from 'react'

export default function TrackTokenDetailLayout(): JSX.Element {
  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={modalFirstScreenOptions} />
      <Stack.Screen name="share" />
    </Stack>
  )
}
