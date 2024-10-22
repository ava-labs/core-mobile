import React from 'react'
import { Stack } from 'utils/navigation/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'utils/navigation/screenOptions'

export default function ReceiveLayout(): JSX.Element {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={modalFirstScreenOptions} />
    </Stack>
  )
}
