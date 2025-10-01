import React, { useEffect, useMemo, useState } from 'react'
import { Stack } from 'common/components/Stack'
import { PageControl } from '@avalabs/k2-alpine'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { useNavigation, useRootNavigationState } from 'expo-router'
import { NavigationState } from '@react-navigation/native'
import { Platform } from 'react-native'
import { NativeStackNavigationOptions } from '@react-navigation/native-stack'

export default function KeystoneOnboardingLayout(): JSX.Element {
  const navigation = useNavigation()
  const [currentPage, setCurrentPage] = useState(0)
  const rootState: NavigationState = useRootNavigationState()

  const screens = useMemo(() => KEYSTONE_ONBOARDING_SCREENS, [])

  useEffect(() => {
    const keystoneOnboardingRoute = rootState.routes
      .find(route => route.name === 'onboarding')
      ?.state?.routes.find(route => route.name === 'keystone')
    if (keystoneOnboardingRoute?.state?.index !== undefined) {
      setCurrentPage(keystoneOnboardingRoute.state.index)
    }
  }, [rootState])

  const renderPageControl = (): React.ReactNode => (
    <PageControl numberOfPage={screens.length - 1} currentPage={currentPage} />
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
    <Stack
      screenOptions={{
        ...stackNavigatorScreenOptions,
        headerShown: false
      }}>
      {screens.map(screen => {
        return <Stack.Screen key={screen} name={screen} />
      })}
    </Stack>
  )
}

const KEYSTONE_ONBOARDING_SCREENS = [
  'termsAndConditions',
  'analyticsConsent',
  'recoveryUsingKeystone',
  'keystoneTroubleshooting',
  'createPin',
  'setWalletName',
  'selectAvatar',
  'confirmation'
]
