import React from 'react'
import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'

export default function VerifyMfaLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{ ...stackNavigatorScreenOptions, headerShown: false }}>
      <Stack.Screen name="selectMfaMethod" />
      <Stack.Screen name="verifyTotpCode" />
    </Stack>
  )
}
