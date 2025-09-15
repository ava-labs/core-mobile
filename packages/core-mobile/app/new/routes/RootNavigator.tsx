import React, { useEffect, useState } from 'react'
import {
  modalScreensOptions,
  stackNavigatorScreenOptions,
  stackScreensOptions
} from 'common/consts/screenOptions'
import { Stack } from 'common/components/Stack'
import { WalletState } from 'store/app/types'
import { useSelector } from 'react-redux'
import { selectIsReady, selectWalletState } from 'store/app/slice'
import { PinScreenOverlay } from 'common/components/PinScreenOverlay'

export function RootNavigator(): JSX.Element {
  const walletState = useSelector(selectWalletState)
  const appIsReady = useSelector(selectIsReady)
  const [shouldRenderOnlyPinScreen, setShouldRenderOnlyPinScreen] =
    useState(true)

  useEffect(() => {
    // set shouldRenderOnlyPinScreen to false once wallet is unlocked
    // do nothing if app is not ready (as we need to sync wallet state after rehydration)
    // or if we have already set shouldRenderOnlyPinScreen to false
    if (!appIsReady || shouldRenderOnlyPinScreen === false) return

    setShouldRenderOnlyPinScreen(walletState !== WalletState.ACTIVE)
  }, [appIsReady, shouldRenderOnlyPinScreen, walletState])

  return (
    <>
      <Stack
        screenOptions={{
          ...stackNavigatorScreenOptions,
          headerShown: false
        }}>
        {/* verified and wallet active */}
        <Stack.Protected guard={walletState !== WalletState.NONEXISTENT}>
          <Stack.Protected guard={!shouldRenderOnlyPinScreen}>
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
          {/* should render only pin screen */}
          <Stack.Protected guard={shouldRenderOnlyPinScreen}>
            <Stack.Screen
              name="loginWithPinOrBiometry"
              options={{
                animation: 'none',
                presentation: 'fullScreenModal',
                headerShown: false,
                gestureEnabled: false
              }}
            />
          </Stack.Protected>
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

      {/* render this pin screen as full window overlay if walletState is previously active and app is coming back from background state */}
      {!shouldRenderOnlyPinScreen && walletState === WalletState.INACTIVE && (
        <PinScreenOverlay />
      )}
    </>
  )
}
