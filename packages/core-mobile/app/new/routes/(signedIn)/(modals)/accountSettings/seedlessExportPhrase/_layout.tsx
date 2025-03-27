import React from 'react'
import { Stack } from 'common/components/Stack'
import { modalStackNavigatorScreenOptions } from 'common/consts/screenOptions'

export default function SeedlessExportPhraseLayout(): JSX.Element {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="notInitiated" />
      <Stack.Screen name="pending" />
      <Stack.Screen name="readyToExport" />
      <Stack.Screen name="refreshSeedlessToken" />
      <Stack.Screen name="verifyExportInitMfa" />
      <Stack.Screen name="verifyExportCompleteMfa" />
    </Stack>
  )
}
