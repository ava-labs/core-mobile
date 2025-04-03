import { Stack } from 'common/components/Stack'
import {
  modalScreensOptions,
  stackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { CollectiblesProvider } from 'features/portfolio/collectibles/CollectiblesContext'
import React from 'react'

export default function WalletLayout(): JSX.Element {
  return (
    <CollectiblesProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen
          name="(modals)/accountSettings"
          options={modalScreensOptions}
        />
        <Stack.Screen name="(modals)/receive" options={modalScreensOptions} />
        <Stack.Screen
          name="(modals)/notifications"
          options={modalScreensOptions}
        />
        <Stack.Screen
          name="(modals)/tokenManagement"
          options={modalScreensOptions}
        />
        <Stack.Screen
          name="(modals)/trackTokenDetail"
          options={modalScreensOptions}
        />
        <Stack.Screen
          name="(modals)/collectibleManagement"
          options={modalScreensOptions}
        />
        <Stack.Screen name="(modals)/addStake" options={modalScreensOptions} />
        <Stack.Screen
          name="(modals)/stakeDetail"
          options={stackNavigatorScreenOptions}
        />
      </Stack>
    </CollectiblesProvider>
  )
}
