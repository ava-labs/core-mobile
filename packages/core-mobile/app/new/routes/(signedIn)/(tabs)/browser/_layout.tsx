import { Stack } from 'common/components/Stack'
import {
  stackNavigatorScreenOptions,
  stackScreensOptions
} from 'common/consts/screenOptions'
import { BrowserProvider } from 'features/browser/BrowserContext'
import React from 'react'

export default function BrowserLayout(): JSX.Element {
  return (
    <BrowserProvider>
      <Stack screenOptions={stackNavigatorScreenOptions}>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="tabs"
          options={{ animation: 'fade', headerShown: false }}
        />
        <Stack.Screen name="history" options={stackScreensOptions} />

        {/* 
          <Stack.Screen
          name={AppNavigation.Modal.UseWalletConnect}
          options={{
            presentation: 'transparentModal'
          }}
          component={UseWalletConnectModal}
          /> 
          */}
      </Stack>
    </BrowserProvider>
  )
}
