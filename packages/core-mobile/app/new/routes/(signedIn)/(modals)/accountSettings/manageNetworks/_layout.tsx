import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import React from 'react'

export default function ManageNetworksLayout(): JSX.Element {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={modalFirstScreenOptions} />
      <Stack.Screen name="addCustomNetwork" />
    </Stack>
  )
}
