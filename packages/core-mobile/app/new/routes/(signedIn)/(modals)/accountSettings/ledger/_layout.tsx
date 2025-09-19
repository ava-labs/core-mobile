import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { LedgerSetupProvider } from 'new/features/ledger/contexts/LedgerSetupContext'
import React from 'react'

export default function LedgerSetupLayout(): JSX.Element {
  return (
    <LedgerSetupProvider>
      <Stack
        screenOptions={{
          ...modalStackNavigatorScreenOptions,
          headerShown: false
        }}
        initialRouteName="pathSelection">
        <Stack.Screen name="pathSelection" options={modalFirstScreenOptions} />
        <Stack.Screen name="deviceConnection" />
        <Stack.Screen name="appConnection" />
        <Stack.Screen
          name="setupProgress"
          options={{
            gestureEnabled: false // Prevent going back during wallet creation
          }}
        />
        <Stack.Screen
          name="complete"
          options={{
            gestureEnabled: false // Prevent going back after completion
          }}
        />
      </Stack>
    </LedgerSetupProvider>
  )
}
