import React from 'react'
import { Stack } from 'common/components/Stack'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'
export default function ApprovalLayout(): JSX.Element {
  const { modalStackNavigatorScreenOptions, modalFirstScreenOptions } =
    useModalScreenOptions()
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={modalFirstScreenOptions} />
    </Stack>
  )
}
