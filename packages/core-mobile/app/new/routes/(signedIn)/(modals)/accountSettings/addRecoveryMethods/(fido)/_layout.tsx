import React from 'react'
import { Stack } from 'common/components/Stack'

export default function FidoLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="fidoNameInput" />
    </Stack>
  )
}
