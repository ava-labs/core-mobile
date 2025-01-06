import React, { useEffect, useState } from 'react'
import { Stack } from 'common/components/Stack'
import { PageControl } from '@avalabs/k2-alpine'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { useNavigationContainerRef } from 'expo-router'

export default function MnemonicOnboardingLayout(): JSX.Element {
  const [currentPage, setCurrentPage] = useState(0)
  const rootState = useNavigationContainerRef().getRootState()

  useEffect(() => {
    const mnemonicOnboardingRoute = rootState.routes
      .find(route => route.name === 'onboarding')
      ?.state?.routes.find(route => route.name === 'mnemonic')
    if (mnemonicOnboardingRoute?.state?.index !== undefined) {
      setCurrentPage(mnemonicOnboardingRoute.state.index)
    }
  }, [rootState])

  const renderPageControl = (): React.ReactNode => (
    <PageControl
      numberOfPage={MNEMONIC_ONBOARDING_SCREENS.length}
      currentPage={currentPage}
    />
  )

  return (
    <Stack
      screenOptions={{
        ...stackNavigatorScreenOptions,
        headerTitle: renderPageControl
      }}>
      {MNEMONIC_ONBOARDING_SCREENS.map(screen => {
        return <Stack.Screen key={screen} name={screen} />
      })}
    </Stack>
  )
}

const MNEMONIC_ONBOARDING_SCREENS = [
  'termsAndConditions',
  'analyticsConsent',
  'recoveryPhrase',
  'verifyRecoveryPhrase',
  'createPin',
  'setWalletName',
  'selectAvatar',
  'confirmation'
]
