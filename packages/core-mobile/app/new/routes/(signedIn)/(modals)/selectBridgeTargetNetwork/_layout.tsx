import { Stack } from 'common/components/Stack'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'
import React from 'react'

export default function SelectBridgeTargetNetworkLayout(): JSX.Element {
  const { modalStackNavigatorScreenOptions, modalFirstScreenOptions } =
    useModalScreenOptions()
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={modalFirstScreenOptions} />
    </Stack>
  )
}
