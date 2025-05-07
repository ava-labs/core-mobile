import React from 'react'
import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { BrowserProvider } from 'features/browser/BrowserContext'

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
          options={{
            headerShown: false,
            presentation: 'modal',
            cardStyleInterpolator: ({ current: { progress } }) => {
              return {
                cardStyle: {
                  opacity: progress
                }
              }
            }
          }}
        />
        <Stack.Screen name="history" />

        {/* 
          <Stack.Screen
          name={AppNavigation.Modal.BrowserTabCloseAll}
          options={{
            presentation: 'transparentModal'
          }}
          component={AreYouSureModal}
          />
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
