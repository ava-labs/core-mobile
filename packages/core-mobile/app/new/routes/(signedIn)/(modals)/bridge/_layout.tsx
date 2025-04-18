import React from 'react'
import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { useSelector } from 'react-redux'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'
import { DelegationContextProvider } from 'contexts/DelegationContext'

export default function BridgeLayout(): JSX.Element {
  const shouldHideOnboarding = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.BRIDGE_ONBOARDING)
  )

  const initialRouteName = shouldHideOnboarding ? 'bridge' : 'onboarding'

  return (
    <DelegationContextProvider>
      <Stack
        screenOptions={modalStackNavigatorScreenOptions}
        initialRouteName={initialRouteName}>
        <Stack.Screen name="onboarding" options={modalFirstScreenOptions} />
        <Stack.Screen
          name="bridge"
          options={shouldHideOnboarding ? modalFirstScreenOptions : undefined}
        />
      </Stack>
    </DelegationContextProvider>
  )
}
