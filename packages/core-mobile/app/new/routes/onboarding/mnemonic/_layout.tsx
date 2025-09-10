import { PageControl } from '@avalabs/k2-alpine'
import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { getCurrentPageIndex } from 'common/utils/getCurrentPageIndex'
import { useLocalSearchParams, useNavigation, usePathname } from 'expo-router'
import React, { useCallback, useEffect, useMemo } from 'react'
import { Platform } from 'react-native'

export default function MnemonicOnboardingLayout(): JSX.Element {
  const navigation = useNavigation()
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
