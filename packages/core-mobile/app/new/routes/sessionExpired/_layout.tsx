import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import React from 'react'

export default function SessionExpiredLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={modalStackNavigatorScreenOptions}
      initialRouteName="index">
      <Stack.Screen name="index" options={modalFirstScreenOptions} />
      <Stack.Screen name="selectMfaMethod" />
      <Stack.Screen name="verifyTotpCode" />
    </Stack>
  )
}
