import React from 'react'
import { Stack } from '../../layouts/Stack'

export default function SignedOutLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
