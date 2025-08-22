import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import React from 'react'

export default function BrowserLayout(): JSX.Element {
  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false
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
  )
}
