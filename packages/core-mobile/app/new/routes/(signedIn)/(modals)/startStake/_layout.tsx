import React from 'react'
import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { useSelector } from 'react-redux'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'

export default function StakeLayout(): JSX.Element {
  const shouldHideOnboarding = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.STAKE_ONBOARDING)
  )

  const initialRouteName = shouldHideOnboarding ? 'amount' : 'onboarding'

  return (
    <Stack
      screenOptions={modalStackNavigatorScreenOptions}
      initialRouteName={initialRouteName}>
      <Stack.Screen name="onboarding" options={modalFirstScreenOptions} />
      <Stack.Screen
        name="amount"
        options={shouldHideOnboarding ? modalFirstScreenOptions : undefined}
      />
    </Stack>
  )
}
