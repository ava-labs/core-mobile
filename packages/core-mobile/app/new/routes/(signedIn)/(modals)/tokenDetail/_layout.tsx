import { Stack } from 'common/components/Stack'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'
import React from 'react'

export default function TokenDetailScreenLayout(): JSX.Element {
  const { stackModalScreensOptions } = useModalScreenOptions()
  return (
    <Stack screenOptions={stackModalScreensOptions}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
