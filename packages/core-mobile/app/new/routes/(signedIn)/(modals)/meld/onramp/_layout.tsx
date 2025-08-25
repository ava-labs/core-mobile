import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import React from 'react'

export default function MeldOnrampLayout(): JSX.Element {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={modalFirstScreenOptions} />
      <Stack.Screen name="selectToken" />
      <Stack.Screen name="selectBuyAmount" />
    </Stack>
  )
}
