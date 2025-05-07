import React from 'react'
import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { useHomeScreenOptions } from 'common/hooks/useHomeScreenOptions'

export default function TrackLayout(): JSX.Element {
  const homeScreenOptions = useHomeScreenOptions()

  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={homeScreenOptions} />
    </Stack>
  )
}
