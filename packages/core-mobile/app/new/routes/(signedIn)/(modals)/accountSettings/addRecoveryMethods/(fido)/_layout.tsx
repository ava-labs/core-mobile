import React from 'react'
import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'

export default function FidoLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{ ...stackNavigatorScreenOptions, headerShown: false }}>
      <Stack.Screen name="fidoNameInput" />
    </Stack>
  )
}
