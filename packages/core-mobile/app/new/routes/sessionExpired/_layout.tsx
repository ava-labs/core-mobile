import { Stack } from 'common/components/Stack'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'
import React from 'react'

export default function SessionExpiredLayout(): JSX.Element {
  const { modalStackNavigatorScreenOptions, modalFirstScreenOptions } =
    useModalScreenOptions()
  return (
    <Stack
      screenOptions={modalStackNavigatorScreenOptions}
      initialRouteName="index">
      <Stack.Screen
        name="index"
        options={{ ...modalFirstScreenOptions, gestureEnabled: false }}
      />
      <Stack.Screen name="selectMfaMethod" />
      <Stack.Screen name="verifyTotpCode" />
    </Stack>
  )
}
