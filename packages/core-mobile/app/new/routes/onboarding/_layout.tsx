import React from 'react'
import { Stack } from 'new/components/navigation/Stack'
import { stackNavigatorScreenOptions } from 'new/utils/navigation/screenOptions'

export default function OnboardingLayout(): JSX.Element {
  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="authenticatorSetup" />
      <Stack.Screen name="unlockAirdrops" />
    </Stack>
  )
}
