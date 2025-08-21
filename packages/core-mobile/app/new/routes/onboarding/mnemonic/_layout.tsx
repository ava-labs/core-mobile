import { PageControl } from '@avalabs/k2-alpine'
import { Stack } from 'common/components/Stack'
import { stackModalScreensOptions } from 'common/consts/screenOptions'
import { getCurrentPageIndex } from 'common/utils/getCurrentPageIndex'
import { useLocalSearchParams, usePathname } from 'expo-router'
import React, { useMemo } from 'react'

export default function MnemonicOnboardingLayout(): JSX.Element {
  const { recovering } = useLocalSearchParams<{ recovering: string }>()
  const pathname = usePathname()

  const screens = useMemo(
    () =>
      recovering === 'true'
        ? MNEMONIC_RECOVERING_SCREENS
        : MNEMONIC_ONBOARDING_SCREENS,
    [recovering]
  )

  const currentPage = getCurrentPageIndex('mnemonic', screens, pathname)

  const renderPageControl = (): React.ReactNode => (
    <PageControl numberOfPage={screens.length} currentPage={currentPage} />
  )

  return (
    <Stack
      screenOptions={{
        ...stackModalScreensOptions,
        headerTitle: renderPageControl,
        headerShown: false
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
