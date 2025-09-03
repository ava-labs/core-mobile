import { Stack } from 'common/components/Stack'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'
import { useFocusEffect } from 'expo-router'
import { useBridgeConfigControl } from 'features/bridge/contexts/BridgeContext'
import React, { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'

export default function BridgeLayout(): JSX.Element {
  const { modalStackNavigatorScreenOptions, modalFirstScreenOptions } =
    useModalScreenOptions()
  const shouldHideOnboarding = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.BRIDGE_ONBOARDING)
  )

  const { enableConfig, disableConfig } = useBridgeConfigControl()

  useFocusEffect(
    useCallback(() => {
      enableConfig()
      return () => {
        disableConfig()
      }
    }, [enableConfig, disableConfig])
  )

  const initialRouteName = shouldHideOnboarding ? 'bridge' : 'onboarding'

  return (
    <Stack
      screenOptions={modalStackNavigatorScreenOptions}
      initialRouteName={initialRouteName}>
      <Stack.Screen name="onboarding" options={modalFirstScreenOptions} />
      <Stack.Screen
        name="bridge"
        options={shouldHideOnboarding ? modalFirstScreenOptions : undefined}
      />
    </Stack>
  )
}
