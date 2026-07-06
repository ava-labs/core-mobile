import React, { useCallback, useEffect, useMemo } from 'react'
import { Stack } from 'common/components/Stack'
import { PageControl } from '@avalabs/k2-alpine'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { useNavigation, usePathname } from 'expo-router'
import { Platform } from 'react-native'
import { NativeStackNavigationOptions } from 'expo-router'
import { LedgerSetupProvider } from 'features/ledger'
import { getCurrentPageIndex } from 'common/utils/getCurrentPageIndex'

export default function LedgerOnboardingLayout(): JSX.Element {
  const navigation = useNavigation()
  const pathname = usePathname()

  const screens = useMemo(() => LEDGER_ONBOARDING_SCREENS, [])

  const currentPage = getCurrentPageIndex('ledger', screens, pathname)

  const renderPageControl = useCallback(
    (): React.ReactNode => (
      <PageControl numberOfPage={screens.length} currentPage={currentPage} />
    ),
    [screens.length, currentPage]
  )

  useEffect(() => {
    if (Platform.OS === 'ios') {
      const navigationOptions: NativeStackNavigationOptions = {
        headerTitle: renderPageControl
      }
      navigation.getParent()?.setOptions(navigationOptions)
    }
  }, [navigation, renderPageControl])

  return (
    <LedgerSetupProvider>
      <Stack
        screenOptions={{
          ...stackNavigatorScreenOptions,
          headerShown: false
        }}>
        {screens.map(screen => {
          return <Stack.Screen key={screen} name={screen} />
        })}
      </Stack>
    </LedgerSetupProvider>
  )
}

const LEDGER_ONBOARDING_SCREENS = [
  'termsAndConditions',
  'analyticsConsent',
  'createPin',
  'pathSelection',
  'deviceConnection',
  'appConnection',
  'setWalletName',
  'selectAvatar',
  'confirmation'
]
