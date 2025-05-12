import React from 'react'
import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { BrowserProvider } from 'features/browser/BrowserContext'
import { View } from 'react-native'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'

export default function BrowserLayout(): JSX.Element {
  const { modalScreensOptions } = useModalScreenOptions()
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
        <Stack.Screen
          name="history"
          options={{
            headerTransparent: true
          }}
        />

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
