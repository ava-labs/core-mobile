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
import {
  onClosingTransitionEnd,
  onClosingTransitionStart
} from 'common/utils/navigationGuard'
import { dismissKeyboardOnClose } from 'common/utils/dismissKeyboardOnClose'
import { currentRouteStore } from './store'

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
        // @ts-ignore: to set the current route name globally
        screenListeners={({ navigation }) => {
          const rootState = navigation.getState()
          const topRoute = rootState.routes[rootState.index]?.name
          if (topRoute) {
            currentRouteStore.getState().setTopRoute(topRoute)
          }
          const state = rootState.routes[rootState.index]?.state
          if (state && state.index !== undefined) {
            const currentRoute = state?.routes[state.index]?.name
            if (currentRoute) {
              currentRouteStore.getState().setCurrentRoute(currentRoute)
            }
          }
          return {
            transitionStart: (e: { data: { closing: boolean } }) => {
              if (e.data.closing) {
                onClosingTransitionStart()
                dismissKeyboardOnClose()
              }
            },
            transitionEnd: (e: { data: { closing: boolean } }) => {
              if (e.data.closing) {
                onClosingTransitionEnd()
                dismissKeyboardOnClose()
              }
            }
          }
        }}
        screenOptions={{
          ...stackNavigatorScreenOptions,
          headerShown: false
        }}>
        {/* verified and wallet active */}
        <Stack.Protected
          guard={
            !shouldRenderOnlyPinScreen &&
            walletState !== WalletState.NONEXISTENT
          }>
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
              // formSheet renders blank on iOS 26 when presented at root from a
              // deep child route, which traps the user with no escape gestures.
              // fullScreenModal bypasses the broken sheet presentation path and
              // matches this screen's hard-blocking re-auth semantics anyway.
              presentation: 'fullScreenModal',
              gestureEnabled: false
            }}
          />
        </Stack.Protected>

        {/* should render only pin screen */}
        <Stack.Protected
          guard={
            shouldRenderOnlyPinScreen && walletState !== WalletState.NONEXISTENT
          }>
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

      {/* render this pin screen as full window overlay if walletState is previously active and app is coming back from background state */}
      {!shouldRenderOnlyPinScreen && walletState === WalletState.INACTIVE && (
        <PinScreenOverlay />
      )}
    </>
  )
}
