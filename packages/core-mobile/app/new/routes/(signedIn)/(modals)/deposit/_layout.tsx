import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'

export default function DepositLayout(): JSX.Element {
  const shouldHideOnboarding = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.DEPOSIT_ONBOARDING)
  )

  const initialRouteName = shouldHideOnboarding ? 'deposit' : 'onboarding'

  return (
    <Stack
      screenOptions={{
        ...modalStackNavigatorScreenOptions
      }}
      initialRouteName={initialRouteName}>
      <Stack.Screen name="onboarding" options={modalFirstScreenOptions} />
      <Stack.Screen
        name="deposit"
        options={shouldHideOnboarding ? modalFirstScreenOptions : undefined}
      />
    </Stack>
  )
}
