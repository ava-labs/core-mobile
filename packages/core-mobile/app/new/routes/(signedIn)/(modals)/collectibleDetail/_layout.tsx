import React from 'react'
import { Stack } from 'common/components/Stack'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'

export default function CollectibleDetailScreenLayout(): JSX.Element {
  const { stackModalScreensOptions } = useModalScreenOptions()
  return (
    <Stack screenOptions={stackModalScreensOptions}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
