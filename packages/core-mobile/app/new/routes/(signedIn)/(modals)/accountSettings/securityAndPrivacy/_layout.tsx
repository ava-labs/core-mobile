import React from 'react'
import { Stack } from 'common/components/Stack'
import { SeedlessMnemonicExportProvider } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import { modalStackNavigatorScreenOptions } from 'common/consts/screenOptions'

export default function SecurityAndPrivacyLayout(): JSX.Element {
  return (
    <SeedlessMnemonicExportProvider>
      <Stack screenOptions={modalStackNavigatorScreenOptions}>
        <Stack.Screen name="index" />
        <Stack.Screen name="showRecoveryPhrase" />
        <Stack.Screen name="recoveryPhraseVerifyPin" />
        <Stack.Screen name="changePin" />
        <Stack.Screen name="verifyChangePin" />
      </Stack>
    </SeedlessMnemonicExportProvider>
  )
}
