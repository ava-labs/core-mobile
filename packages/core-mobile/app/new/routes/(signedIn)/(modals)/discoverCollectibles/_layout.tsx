import { Stack } from 'common/components/Stack'
import { stackScreensOptions } from 'common/consts/screenOptions'
import React from 'react'

export default function BrowserCollectiblesLayout(): JSX.Element {
  return (
    <Stack screenOptions={stackScreensOptions}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
