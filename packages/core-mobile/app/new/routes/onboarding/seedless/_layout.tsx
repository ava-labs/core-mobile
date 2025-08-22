import { PageControl } from '@avalabs/k2-alpine'
import { Stack } from 'common/components/Stack'
import { stackScreensOptions } from 'common/consts/screenOptions'
import { getCurrentPageIndex } from 'common/utils/getCurrentPageIndex'
import { useLocalSearchParams, usePathname } from 'expo-router'
import React, { useMemo } from 'react'

export default function SeedlessOnboardingLayout(): JSX.Element {
  const { recovering } = useLocalSearchParams<{ recovering: string }>()
  const pathname = usePathname()

  const currentPage = getCurrentPageIndex(
    'seedless',
    SEEDLESS_ONBOARDING_SCREENS,
    pathname
  )

  const numberOfPages = useMemo(
    () => SEEDLESS_ONBOARDING_SCREENS.length + (recovering === 'true' ? 1 : 0),
    [recovering]
  )

  const renderPageControl = (): React.ReactNode => {
    return (
      <PageControl numberOfPage={numberOfPages} currentPage={currentPage} />
    )
  }

  return (
    <Stack
      screenOptions={{
        ...stackScreensOptions,
        headerTitle: renderPageControl,
        headerShown: false
      }}>
      {SEEDLESS_ONBOARDING_SCREENS.map(screen => {
        return <Stack.Screen key={screen} name={screen} />
      })}
    </Stack>
  )
}

const SEEDLESS_ONBOARDING_SCREENS = [
  'termsAndConditions',
  'addRecoveryMethods', // or selectMfaMethod
  'analyticsConsent',
  'createPin',
  'setWalletName',
  'selectAvatar',
  'confirmation'
]
