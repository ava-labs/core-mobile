import React from 'react'
import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { SeedlessMnemonicExportProvider } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'

export default function AccountSettingsLayout(): JSX.Element {
  return (
    <SeedlessMnemonicExportProvider>
      <Stack screenOptions={modalStackNavigatorScreenOptions}>
        <Stack.Screen name="index" options={modalFirstScreenOptions} />
        <Stack.Screen name="account" />
        <Stack.Screen name="selectCurrency" />
        <Stack.Screen name="selectAppearance" />
        <Stack.Screen name="securityAndPrivacy" />
        <Stack.Screen name="connectedSites" />
        <Stack.Screen name="showRecoveryPhrase" />
        <Stack.Screen name="changePin" />
        <Stack.Screen name="verifyChangePin" />
        <Stack.Screen name="notificationPreferences" />
        <Stack.Screen name="manageAccounts" />
        <Stack.Screen name="addressBook" />
        <Stack.Screen name="showRecoveryMethods" />
        <Stack.Screen name="recoveryPhraseVerifyPin" />
        <Stack.Screen name="recoveryMethodsVerifyPin" />
        <Stack.Screen name="seedlessExportPhrase" />
        <Stack.Screen name="manageAccounts" />
        <Stack.Screen name="biometricVerifyPin" />
        <Stack.Screen name="addressBook" />
      </Stack>
    </SeedlessMnemonicExportProvider>
  )
}
