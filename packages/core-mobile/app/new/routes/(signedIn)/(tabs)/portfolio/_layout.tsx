import { Stack } from 'common/components/Stack'
import {
  homeScreenOptions,
  stackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { CollectiblesProvider } from 'features/portfolio/collectibles/CollectiblesContext'
import React from 'react'

export default function PortfolioLayout(): JSX.Element {
  return (
    <CollectiblesProvider>
      <Stack screenOptions={stackNavigatorScreenOptions}>
        <Stack.Screen name="index" options={homeScreenOptions} />
      </Stack>
    </CollectiblesProvider>
  )
}
