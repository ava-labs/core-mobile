import { Stack } from 'common/components/Stack'
import {
  formSheetScreensOptions,
  modalScreensOptions,
  stackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { CollectiblesProvider } from 'features/portfolio/collectibles/CollectiblesContext'
import React from 'react'

const PolyfillCrypto = React.lazy(() => import('react-native-webview-crypto'))

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
        <Stack.Screen name="(modals)/send" options={modalScreensOptions} />
        <Stack.Screen name="(modals)/swap" options={modalScreensOptions} />
        <Stack.Screen
          name="(modals)/selectToken"
          options={formSheetScreensOptions}
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
      <PolyfillCrypto />
    </CollectiblesProvider>
  )
}
