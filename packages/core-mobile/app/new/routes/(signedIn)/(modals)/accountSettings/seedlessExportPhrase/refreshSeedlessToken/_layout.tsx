import React from 'react'
import { Stack } from 'common/components/Stack'

export default function RefreshSeedlessTokenLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="verifyTotpCode" />
      <Stack.Screen name="selectMfaMethod" />
    </Stack>
  )
}
