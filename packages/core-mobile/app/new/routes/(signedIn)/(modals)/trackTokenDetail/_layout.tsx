import React from 'react'
import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'

export default function TrackTokenDetailLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        ...modalStackNavigatorScreenOptions
      }}>
      <Stack.Screen name="index" options={modalFirstScreenOptions} />
      <Stack.Screen name="share" />
    </Stack>
  )
}
