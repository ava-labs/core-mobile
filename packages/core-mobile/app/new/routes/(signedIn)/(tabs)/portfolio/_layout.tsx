import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { useHomeScreenOptions } from 'common/hooks/useHomeScreenOptions'
import React from 'react'

export default function PortfolioLayout(): JSX.Element {
  const homeScreenOptions = useHomeScreenOptions()

  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={homeScreenOptions} />
    </Stack>
  )
}
