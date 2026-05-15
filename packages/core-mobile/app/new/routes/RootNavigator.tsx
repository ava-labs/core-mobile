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
import { currentRouteStore } from './store'

export function RootNavigator(): JSX.Element {
  const walletState = useSelector(selectWalletState)
  const appIsReady = useSelector(selectIsReady)
  // Derive initial value from current redux state so the first frame already
  // has the correct guard. Previously this was hard-coded to `true`, which
  // forced a PIN-only → signedIn group swap on every fresh mount (including
  // warm-background reactivation after notifee.onBackgroundEvent), producing
  // a transient blank flash as <Stack.Protected> tore down one group and
  // mounted the other.
  const [shouldRenderOnlyPinScreen, setShouldRenderOnlyPinScreen] = useState(
    () => !appIsReady || walletState !== WalletState.ACTIVE
  )

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(
      `[BLANK-DEBUG] RootNavigator render shouldRenderOnlyPinScreen=${shouldRenderOnlyPinScreen} walletState=${walletState} appIsReady=${appIsReady}`
    )
  }, [shouldRenderOnlyPinScreen, walletState, appIsReady])

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
          const state =
            navigation.getState().routes[navigation.getState().index]?.state
          if (state && state.index !== undefined) {
            const currentRoute = state?.routes[state.index]?.name
            if (currentRoute) {
              currentRouteStore.getState().setCurrentRoute(currentRoute)
            }
          }
          return {
            transitionStart: (e: { data: { closing: boolean } }) => {
              if (e.data.closing) onClosingTransitionStart()
            },
            transitionEnd: (e: { data: { closing: boolean } }) => {
              if (e.data.closing) onClosingTransitionEnd()
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
