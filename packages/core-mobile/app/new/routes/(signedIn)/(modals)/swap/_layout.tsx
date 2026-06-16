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
          {/* Recurring-swap screens (CP-14396 / CP-14399). Frequency and
              number-of-orders are picked inline on the swap screen; only the
              schedules list lives in its own stack. The review step is
              intentionally skipped — pressing Next on the swap form goes
              straight to the ApprovalController modal. */}
          <Stack.Screen name="recurring/schedules" />
        </Stack>
      </RecurringSwapContextProvider>
    </SwapContextProvider>
  )
}
