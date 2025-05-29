import React from 'react'
import { Stack } from 'common/components/Stack'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'

export default function AccountSettingsLayout(): JSX.Element {
  const { modalStackNavigatorScreenOptions, modalFirstScreenOptions } =
    useModalScreenOptions()

  return (
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
      <Stack.Screen name="manageAccounts" />
      <Stack.Screen name="manageNetworks" />
      <Stack.Screen name="addressBook" />
      <Stack.Screen name="recoveryPhraseVerifyPin" />
      <Stack.Screen name="seedlessExportPhrase" />
      <Stack.Screen name="biometricVerifyPin" />
      <Stack.Screen name="selectAvatar" />
      <Stack.Screen name="notificationPreferences" />
      <Stack.Screen name="addOrConnectWallet" />
      <Stack.Screen name="importPrivateKey" />
      <Stack.Screen name="importSeedWallet" />
      <Stack.Screen name="verifyPin" />
      <Stack.Screen name="verifyPinForImportPrivateKey" />
    </Stack>
  )
}
