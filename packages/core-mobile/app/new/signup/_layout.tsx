import React from 'react'
import { Stack } from 'utils/navigation/Stack'

export default function SignedOutLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
