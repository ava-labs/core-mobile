import React from 'react'
import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalScreenOptionsWithHeaderBack,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'

export default function TokenManagementLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        ...modalStackNavigatorScreenOptions
      }}>
      <Stack.Screen name="index" options={modalFirstScreenOptions} />
      <Stack.Screen
        name="addCustomToken"
        options={modalScreenOptionsWithHeaderBack}
      />
      <Stack.Screen
        name="scanQrCode"
        options={modalScreenOptionsWithHeaderBack}
      />
    </Stack>
  )
}
