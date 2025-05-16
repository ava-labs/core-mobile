import { Stack } from 'common/components/Stack'
import { modalScreenOptionsWithHeaderBack } from 'common/consts/screenOptions'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'
import React from 'react'

export default function TokenManagementLayout(): JSX.Element {
  const { modalStackNavigatorScreenOptions, modalFirstScreenOptions } =
    useModalScreenOptions()
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={modalFirstScreenOptions} />
      <Stack.Screen
        name="addCustomToken"
        options={modalScreenOptionsWithHeaderBack}
      />
      <Stack.Screen
        name="scanQrCode"
        options={modalScreenOptionsWithHeaderBack}
      />
      <Stack.Screen
        name="selectNetwork"
        options={modalScreenOptionsWithHeaderBack}
      />
    </Stack>
  )
}
