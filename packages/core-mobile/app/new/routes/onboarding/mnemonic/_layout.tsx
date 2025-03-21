import React, { useEffect, useMemo, useState } from 'react'
import { Stack } from 'common/components/Stack'
import { PageControl } from '@avalabs/k2-alpine'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { useGlobalSearchParams, useNavigationContainerRef } from 'expo-router'

export default function MnemonicOnboardingLayout(): JSX.Element {
  const { recovering } = useGlobalSearchParams<{ recovering: string }>()
  const [currentPage, setCurrentPage] = useState(0)
  const rootState = useNavigationContainerRef().getRootState()

  const isRecovering = recovering === 'true'
  const screens = useMemo(
    () =>
      isRecovering ? MNEMONIC_RECOVERING_SCREENS : MNEMONIC_ONBOARDING_SCREENS,
    [isRecovering]
  )

  useEffect(() => {
    const mnemonicOnboardingRoute = rootState.routes
      .find(route => route.name === 'onboarding')
      ?.state?.routes.find(route => route.name === 'mnemonic')
    if (mnemonicOnboardingRoute?.state?.index !== undefined) {
      setCurrentPage(mnemonicOnboardingRoute.state.index)
    }
  }, [rootState])

  const renderPageControl = (): React.ReactNode => (
    <PageControl numberOfPage={screens.length} currentPage={currentPage} />
  )

  return (
    <Stack
      screenOptions={{
        ...stackNavigatorScreenOptions,
        headerTitle: renderPageControl
      }}>
      {screens.map(screen => {
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

const MNEMONIC_RECOVERING_SCREENS = [
  'termsAndConditions',
  'analyticsConsent',
  'enterRecoveryPhrase',
  'createPin',
  'setWalletName',
  'selectAvatar',
  'confirmation'
]
