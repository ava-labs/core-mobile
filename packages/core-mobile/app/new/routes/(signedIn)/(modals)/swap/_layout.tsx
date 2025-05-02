import { Stack } from 'common/components/Stack'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'
import { SwapContextProvider } from 'features/swap/contexts/SwapContext'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'

export default function SwapLayout(): JSX.Element {
  const { modalStackNavigatorScreenOptions, modalFirstScreenOptions } =
    useModalScreenOptions()
  const shouldHideOnboarding = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.SWAP_ONBOARDING)
  )

  const initialRouteName = shouldHideOnboarding ? 'swap' : 'onboarding'

  return (
    <SwapContextProvider>
      <Stack
        screenOptions={modalStackNavigatorScreenOptions}
        initialRouteName={initialRouteName}>
        <Stack.Screen name="onboarding" options={modalFirstScreenOptions} />
        <Stack.Screen
          name="swap"
          options={shouldHideOnboarding ? modalFirstScreenOptions : undefined}
        />
      </Stack>
    </SwapContextProvider>
  )
}
