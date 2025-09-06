import { PageControl } from '@avalabs/k2-alpine'
import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { getCurrentPageIndex } from 'common/utils/getCurrentPageIndex'
import { useLocalSearchParams, useNavigation, usePathname } from 'expo-router'
import React, { useCallback, useEffect, useMemo } from 'react'

export default function SeedlessOnboardingLayout(): JSX.Element {
  const { recovering } = useLocalSearchParams<{ recovering: string }>()
  const pathname = usePathname()
  const navigation = useNavigation()

  const currentPage = getCurrentPageIndex(
    'seedless',
    SEEDLESS_ONBOARDING_SCREENS,
    pathname
  )

  const numberOfPages = useMemo(
    () => SEEDLESS_ONBOARDING_SCREENS.length + (recovering === 'true' ? 1 : 0),
    [recovering]
  )
  const renderPageControl = useCallback(
    (): React.ReactNode => (
      <PageControl numberOfPage={numberOfPages} currentPage={currentPage} />
    ),
    [numberOfPages, currentPage]
  )

  useEffect(() => {
    const navigationOptions: NativeStackNavigationOptions = {
      headerTitle: renderPageControl
    }
    navigation.getParent()?.setOptions(navigationOptions)
  }, [navigation, renderPageControl])

  return (
    <Stack
      screenOptions={{
        ...stackNavigatorScreenOptions,
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
