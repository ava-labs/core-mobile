import React from 'react'
import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'

export default function AccountSettingsLayout(): JSX.Element {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={modalFirstScreenOptions} />
      <Stack.Screen name="account" />
      <Stack.Screen name="selectCurrency" />
      <Stack.Screen name="selectAppearance" />
      <Stack.Screen name="securityAndPrivacy" />
      <Stack.Screen name="connectedSites" />
      <Stack.Screen name="recoveryMethods" />
      <Stack.Screen name="showRecoveryPhrase" />
    </Stack>
  )
}
