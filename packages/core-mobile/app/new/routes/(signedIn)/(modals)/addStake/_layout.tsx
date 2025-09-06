import React from 'react'
import { Stack } from 'common/components/Stack'
import { useSelector } from 'react-redux'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'
import { DelegationContextProvider } from 'contexts/DelegationContext'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'

export default function StakeLayout(): JSX.Element {
  const shouldHideOnboarding = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.STAKE_ONBOARDING)
  )

  const initialRouteName = shouldHideOnboarding ? 'amount' : 'onboarding'

  return (
    <DelegationContextProvider>
      <Stack
        screenOptions={modalStackNavigatorScreenOptions}
        initialRouteName={initialRouteName}>
        <Stack.Screen name="onboarding" options={modalFirstScreenOptions} />
        <Stack.Screen
          name="amount"
          options={shouldHideOnboarding ? modalFirstScreenOptions : undefined}
        />
        <Stack.Screen name="duration" />
        <Stack.Screen name="nodeParameters" />
        <Stack.Screen name="selectNode" />
        <Stack.Screen name="nodeDetails" />
        <Stack.Screen name="confirm" />
      </Stack>
    </DelegationContextProvider>
  )
}
