import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import React from 'react'

export default function WithdrawLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        ...modalStackNavigatorScreenOptions
      }}>
      <Stack.Screen name="selectAmount" options={modalFirstScreenOptions} />
    </Stack>
  )
}
