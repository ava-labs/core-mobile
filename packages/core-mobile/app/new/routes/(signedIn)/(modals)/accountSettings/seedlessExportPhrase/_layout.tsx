import React from 'react'
import { Stack } from 'common/components/Stack'

export default function SeedlessExportPhraseLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="notInitiated" />
      <Stack.Screen name="pending" />
      <Stack.Screen name="readyToExport" />
      <Stack.Screen name="refreshSeedlessToken" />
      <Stack.Screen name="verifyExportInitMfa" />
      <Stack.Screen name="verifyExportCompleteMfa" />
    </Stack>
  )
}
