import React from 'react'
import { Stack } from 'new/components/navigation/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'new/utils/navigation/screenOptions'

export default function NotificationsLayout(): JSX.Element {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={modalFirstScreenOptions} />
    </Stack>
  )
}
