import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions,
  stackScreensOptions
} from 'common/consts/screenOptions'
import React from 'react'

export default function NotificationsLayout(): JSX.Element {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={modalFirstScreenOptions} />
      <Stack.Screen name="swapDetail" options={stackScreensOptions} />
    </Stack>
  )
}
