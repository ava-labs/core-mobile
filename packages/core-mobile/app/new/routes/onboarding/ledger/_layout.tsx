import React, { useEffect, useMemo, useState } from 'react'
import { Stack } from 'common/components/Stack'
import { PageControl } from '@avalabs/k2-alpine'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { useNavigation, useRootNavigationState } from 'expo-router'
import { NavigationState } from '@react-navigation/native'
import { Platform } from 'react-native'
import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { LedgerSetupProvider } from 'features/ledger'

export default function LedgerOnboardingLayout(): JSX.Element {
  const navigation = useNavigation()
  const [currentPage, setCurrentPage] = useState(0)
  const rootState: NavigationState = useRootNavigationState()

  const screens = useMemo(() => LEDGER_ONBOARDING_SCREENS, [])

  useEffect(() => {
    const ledgerOnboardingRoute = rootState.routes
      .find(route => route.name === 'onboarding')
      ?.state?.routes.find(route => route.name === 'ledger')
    if (ledgerOnboardingRoute?.state?.index !== undefined) {
      setCurrentPage(ledgerOnboardingRoute.state.index)
    }
  }, [rootState])

  const renderPageControl = (): React.ReactNode => (
    <PageControl numberOfPage={screens.length} currentPage={currentPage} />
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
