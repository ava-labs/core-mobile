import React from 'react'
import { Stack } from '../../../../layouts/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from '../../../../utils/screenOptions'

export default function ReceiveLayout(): JSX.Element {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={modalFirstScreenOptions} />
    </Stack>
  )
}
