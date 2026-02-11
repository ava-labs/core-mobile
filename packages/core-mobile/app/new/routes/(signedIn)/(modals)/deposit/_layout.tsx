import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import React from 'react'

export default function DepositLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        ...modalStackNavigatorScreenOptions
      }}
      initialRouteName="onboarding">
      <Stack.Screen name="onboarding" options={modalFirstScreenOptions} />
      <Stack.Screen name="selectAsset" />
      <Stack.Screen name="selectPool" />
      <Stack.Screen name="selectAmount" />
    </Stack>
  )
}
