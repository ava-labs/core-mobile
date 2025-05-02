import { Stack } from 'common/components/Stack'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'
import React from 'react'

export default function SelectSwapToTokenLayout(): JSX.Element {
  const { modalStackNavigatorScreenOptions } = useModalScreenOptions()
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
