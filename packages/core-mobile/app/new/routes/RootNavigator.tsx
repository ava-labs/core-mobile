import React from 'react'
import {
  modalScreensOptions,
  stackNavigatorScreenOptions,
  stackScreensOptions
} from 'common/consts/screenOptions'
import { Stack } from 'common/components/Stack'
import { WalletState } from 'store/app/types'
import { useSelector } from 'react-redux'
import { selectWalletState } from 'store/app/slice'

export function RootNavigator(): JSX.Element {
  const walletState = useSelector(selectWalletState)

  return (
    <Stack
      screenOptions={{
        ...stackNavigatorScreenOptions,
        headerShown: false
      }}>
      {/* verified and wallet active */}
      <Stack.Protected guard={walletState === WalletState.ACTIVE}>
        <Stack.Screen
          name="(signedIn)"
          options={{
            headerShown: false,
            animation: 'none',
            gestureEnabled: false
          }}
        />
        <Stack.Screen
          name="sessionExpired"
          options={{
            ...modalScreensOptions,
            gestureEnabled: false
          }}
        />
      </Stack.Protected>

      {/* wallet inactive */}
      <Stack.Protected guard={walletState === WalletState.INACTIVE}>
        <Stack.Screen
          name="loginWithPinOrBiometry"
          options={{
            animation: 'none',
            presentation: 'fullScreenModal',
            headerShown: false,
            gestureEnabled: false
          }}
        />
        <Stack.Screen name="forgotPin" options={{ headerShown: true }} />
      </Stack.Protected>

      {/* wallet nonexistent */}
      <Stack.Protected guard={walletState === WalletState.NONEXISTENT}>
        <Stack.Screen name="signup" options={{ animation: 'none' }} />
        <Stack.Screen
          name="onboarding"
          options={{ ...stackScreensOptions, headerShown: true }}
        />
        <Stack.Screen
          name="accessWallet"
          options={{ ...stackScreensOptions, headerShown: true }}
        />
      </Stack.Protected>

      <Stack.Screen name="+not-found" />
    </Stack>
  )
}
