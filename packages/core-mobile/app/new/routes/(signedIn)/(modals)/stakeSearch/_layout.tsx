import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import React from 'react'

export default function StakeSearchLayout(): JSX.Element {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen
        name="index"
        // The screen owns its own SearchBar + Cancel button, so we hide
        // the native stack header entirely.
        options={{ ...modalFirstScreenOptions, headerShown: false }}
      />
    </Stack>
  )
}
