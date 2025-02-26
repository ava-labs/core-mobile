import React from 'react'
import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalScreenOptionsWithHeaderBack,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { useTheme } from '@avalabs/k2-alpine'

export default function TokenManagementLayout(): JSX.Element {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <Stack
      screenOptions={{
        ...modalStackNavigatorScreenOptions,
        headerStyle: {
          backgroundColor: colors.$surfacePrimary
        }
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
