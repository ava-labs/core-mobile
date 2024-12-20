import React, { useEffect, useState } from 'react'
import { Stack } from 'new/components/navigation/Stack'
import { PageControl } from '@avalabs/k2-alpine'
import { stackNavigatorScreenOptions } from 'new/utils/navigation/screenOptions'
import { useRootNavigationState } from 'expo-router'

export default function OnboardingLayout(): JSX.Element {
  const [currentPage, setCurrentPage] = useState(0)

  const navigationState = useRootNavigationState()

  useEffect(() => {
    const onboardingRoute = navigationState.routes.find(
      route => route.name === 'onboarding'
    )
    if (onboardingRoute?.state?.index !== undefined) {
      setCurrentPage(onboardingRoute.state.index)
    }
  }, [navigationState])

  const renderPageControl = (): React.ReactNode => (
    <PageControl
      numberOfPage={NUMBER_OF_ONBOARDING_PAGES}
      currentPage={currentPage}
    />
  )

  return (
    <Stack
      screenOptions={{
        ...stackNavigatorScreenOptions,
        headerTitle: renderPageControl
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="analyticsConsent" />
      <Stack.Screen name="recoveryPhrase" />
      <Stack.Screen name="verifyRecoveryPhrase" />
      <Stack.Screen name="createPin" />
    </Stack>
  )
}

const NUMBER_OF_ONBOARDING_PAGES = 5
