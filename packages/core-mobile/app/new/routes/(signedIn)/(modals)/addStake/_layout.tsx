import React, { useEffect } from 'react'
import { Stack } from 'common/components/Stack'
import { useSelector } from 'react-redux'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'
import { DelegationContextProvider } from 'contexts/DelegationContext'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { useStakeAmount } from 'hooks/earn/useStakeAmount'
import { zeroAvaxPChain } from 'utils/units/zeroValues'

export default function StakeLayout(): JSX.Element {
  const shouldHideOnboarding = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.STAKE_ONBOARDING)
  )

  const initialRouteName = shouldHideOnboarding ? 'amount' : 'onboarding'

  const [_, setStakeAmount] = useStakeAmount()

  useEffect(() => {
    setStakeAmount(zeroAvaxPChain())
  }, [setStakeAmount])

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
