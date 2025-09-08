import React from 'react'
import {
  forNoAnimation,
  stackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'
import { useWalletState } from 'contexts/WalletStateContext'
import { Stack } from 'common/components/Stack'
import { WalletState } from 'store/app/types'

export function RootNavigator(): JSX.Element {
  const { isLocked, walletState } = useWalletState()
  const { modalScreensOptions } = useModalScreenOptions()

  return (
    <Stack
      screenOptions={{
        ...stackNavigatorScreenOptions,
        headerShown: false
      }}>
      {/* verified and wallet active */}
      <Stack.Protected guard={!isLocked && walletState === WalletState.ACTIVE}>
        <Stack.Screen
          name="(signedIn)"
          options={{
            headerShown: false,
            animation: 'none',
            gestureEnabled: false
          }}
        />
      </Stack.Protected>

      {/* not verified */}
      <Stack.Protected guard={isLocked}>
        {/* wallet inactive */}
        <Stack.Protected guard={walletState === WalletState.INACTIVE}>
          <Stack.Screen
            name="loginWithPinOrBiometry"
            options={{
              presentation: 'modal',
              headerShown: false,
              gestureEnabled: false,
              cardStyleInterpolator: forNoAnimation
            }}
          />
          <Stack.Screen name="forgotPin" options={{ headerShown: true }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen
            name="sessionExpired"
            options={{
              ...modalScreensOptions,
              gestureEnabled: false
            }}
          />
        </Stack.Protected>

        {/* wallet nonexistent */}
        <Stack.Protected guard={walletState === WalletState.NONEXISTENT}>
          <Stack.Screen name="signup" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="accessWallet" options={{ headerShown: true }} />
        </Stack.Protected>
      </Stack.Protected>
    </Stack>
  )
}
