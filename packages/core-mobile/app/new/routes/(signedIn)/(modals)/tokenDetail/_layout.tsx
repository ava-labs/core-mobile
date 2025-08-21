import { Stack } from 'common/components/Stack'
import { stackModalScreensOptions } from 'common/consts/screenOptions'
import React from 'react'

export default function TokenDetailScreenLayout(): JSX.Element {
  return (
    <Stack screenOptions={stackModalScreensOptions}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
