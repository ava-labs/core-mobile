import React, { useEffect, useState } from 'react'
import { Stack } from 'common/components/Stack'
import { PageControl } from '@avalabs/k2-alpine'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { useNavigationContainerRef } from 'expo-router'

export default function SeedlessOnboardingLayout(): JSX.Element {
  const [currentPage, setCurrentPage] = useState(0)
  const rootState = useNavigationContainerRef().getRootState()

  useEffect(() => {
    const seedlessOnboardingRoute = rootState.routes
      .find(r => r.name === 'onboarding')
      ?.state?.routes.find(r => r.name === 'seedless')

    if (seedlessOnboardingRoute?.state?.index !== undefined) {
      setCurrentPage(seedlessOnboardingRoute.state.index)
    }
  }, [rootState])

  const renderPageControl = (): React.ReactNode => {
    return (
      <PageControl
        numberOfPage={SEEDLESS_ONBOARDING_SCREENS.length}
        currentPage={currentPage}
      />
    )
  }

  return (
    <Stack
      screenOptions={{
        ...stackNavigatorScreenOptions,
        headerTitle: renderPageControl
      }}>
      {SEEDLESS_ONBOARDING_SCREENS.map(screen => {
        return <Stack.Screen key={screen} name={screen} />
      })}
      <Stack.Screen name="verifyCodeModal" />
    </Stack>
  )
}

const SEEDLESS_ONBOARDING_SCREENS = [
  'termsAndConditions',
  'addRecoveryMethods', // or selectRecoveryMethods
  'analyticsConsent',
  'createPin',
  'setWalletName',
  'selectAvatar',
  'confirmation'
]
