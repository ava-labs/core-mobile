import React from 'react'
import { Stack } from 'common/components/Stack'
import { modalScreensOptions } from 'common/consts/screenOptions'
import { NFTMetadataProvider } from 'contexts/NFTItemsContext'

export default function WalletLayout(): JSX.Element {
  return (
    <NFTMetadataProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ animationEnabled: false }} />
        <Stack.Screen name="(modals)/settings" options={modalScreensOptions} />
        <Stack.Screen name="(modals)/receive" options={modalScreensOptions} />
        <Stack.Screen
          name="(modals)/notifications"
          options={modalScreensOptions}
        />
        <Stack.Screen
          name="(modals)/tokenManagement"
          options={modalScreensOptions}
        />
      </Stack>
    </NFTMetadataProvider>
  )
}
