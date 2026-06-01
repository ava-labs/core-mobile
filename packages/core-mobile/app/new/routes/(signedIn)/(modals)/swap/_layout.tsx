import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { SwapContextProvider } from 'features/swap/contexts/SwapContext'
import { RecurringSwapContextProvider } from 'features/recurringSwap/contexts/RecurringSwapContext'
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
          <Stack.Screen name="recurring/frequency" />
          <Stack.Screen name="recurring/orders" />
          <Stack.Screen name="recurring/review" />
        </Stack>
      </RecurringSwapContextProvider>
    </SwapContextProvider>
  )
}
