import React, { useEffect, useState, useMemo } from 'react'
import { Stack } from 'new/components/navigation/Stack'
import { PageControl } from '@avalabs/k2-alpine'
import { stackNavigatorScreenOptions } from 'new/utils/navigation/screenOptions'
import { useOnboardingContext } from 'new/contexts/OnboardingProvider'
import { useNavigationContainerRef } from 'expo-router'

export default function SeedlessOnboardingLayout(): JSX.Element {
  const [currentPage, setCurrentPage] = useState(0)
  const { hasWalletName } = useOnboardingContext()
  const rootState = useNavigationContainerRef().getRootState()

  useEffect(() => {
    const onboardingRoute = rootState.routes.find(
      r => r.name === 'seedlessOnboarding'
    )
    if (onboardingRoute?.state?.index !== undefined) {
      setCurrentPage(onboardingRoute.state.index)
    }
  }, [rootState])

  // Return the onboarding screens based on the hasWalletName
  // if hasWalletName is true, the function should not include the 'setWalletName' screen
  const onboardingScreens = useMemo(() => {
    return SEEDLESS_ONBOARDING_SCREENS.reduce((acc, screen) => {
      if (hasWalletName === true && screen === 'setWalletName') {
        return acc
      }
      return [...acc, screen]
    }, [] as string[])
  }, [hasWalletName])

  const renderPageControl = (): React.ReactNode => (
    <PageControl
      numberOfPage={onboardingScreens.length}
      currentPage={currentPage}
    />
  )

  return (
    <Stack
      screenOptions={{
        ...stackNavigatorScreenOptions,
        headerTitle: renderPageControl
      }}>
      {onboardingScreens.map(screen => {
        return <Stack.Screen key={screen} name={screen} />
      })}
    </Stack>
  )
}

const SEEDLESS_ONBOARDING_SCREENS = [
  'termsAndConditions',
  'addRecoveryMethods',
  'analyticsConsent',
  'createPin',
  'setWalletName',
  'selectAvatar',
  'confirmation'
]
