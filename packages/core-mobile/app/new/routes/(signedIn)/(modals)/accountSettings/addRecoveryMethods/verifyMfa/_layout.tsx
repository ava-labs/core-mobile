import React from 'react'
import { Stack } from 'common/components/Stack'

export default function VerifyMfaLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="selectMfaMethod" />
      <Stack.Screen name="verifyTotpCode" />
    </Stack>
  )
}
