import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { RecurringSwapContextProvider } from 'features/recurringSwap/contexts/RecurringSwapContext'
import { SwapContextProvider } from 'features/swap/contexts/SwapContext'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'

export default function SwapLayout(): JSX.Element {
  const shouldHideOnboarding = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.SWAP_ONBOARDING)
  )

  const initialRouteName = shouldHideOnboarding ? 'swap' : 'onboarding'

  return (
    <SwapContextProvider>
      <RecurringSwapContextProvider>
        <Stack
          screenOptions={{
            ...modalStackNavigatorScreenOptions
          }}
          initialRouteName={initialRouteName}>
          <Stack.Screen name="onboarding" options={modalFirstScreenOptions} />
          <Stack.Screen
            name="swap"
            options={shouldHideOnboarding ? modalFirstScreenOptions : undefined}
          />
          <Stack.Screen name="pricingDetails" />
          <Stack.Screen name="slippageDetails" />
          <Stack.Screen
            name="recurring/schedules"
            options={({ route }) => {
              // Conditional header based on entry point (passed via the
              // banner's `from` prop as a route param):
              //   - `from === 'swap'` → user pushed the screen on top of
              //      the swap form; keep the back button so they can
              //      return to the form they were editing.
              //   - default (Activity-tab entry) → schedules screen is
              //      the first screen in this modal stack; hide the back
              //      button (dismiss via the sheet close affordance).
              const params = route.params as { from?: string } | undefined
              return params?.from === 'swap' ? {} : modalFirstScreenOptions
            }}
          />
        </Stack>
      </RecurringSwapContextProvider>
    </SwapContextProvider>
  )
}
