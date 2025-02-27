import React from 'react'
import { Stack } from 'common/components/Stack'
import {
  homeScreenOptions,
  stackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { CollectiblesProvider } from 'features/portfolio/collectibles/CollectiblesContext'

export default function PortfolioLayout(): JSX.Element {
  return (
    <CollectiblesProvider>
      <Stack screenOptions={stackNavigatorScreenOptions}>
        <Stack.Screen name="index" options={homeScreenOptions} />
        <Stack.Screen name="defiDetail" />
      </Stack>
    </CollectiblesProvider>
  )
}
