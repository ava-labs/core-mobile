import { View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import React, { FC, useLayoutEffect, useState } from 'react'
import { Alert } from 'react-native'
import AuthButtons from 'seedless/components/AuthButtons'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import GoogleSigninService from 'seedless/services/GoogleSigninService'

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.Signup
>['navigation']

const SigninScreen: FC = () => {
  const navigation = useNavigation<NavigationProp>()
  const [isLoading, setIsLoading] = useState(false)
  const {
    theme: { colors }
  } = useTheme()

  const handleSigninWithMnemonic = (): void => {
    navigation.navigate(AppNavigation.Onboard.Welcome, {
      screen: AppNavigation.Onboard.AnalyticsConsent,
      params: {
        nextScreen: AppNavigation.Onboard.EnterWithMnemonicStack
      }
    })
  }

  const handleSigninWithGoogle = async (): Promise<Promise<Promise<void>>> => {
    const oidcToken = await GoogleSigninService.signin()

    setIsLoading(true)
    const result = await CoreSeedlessAPIService.register(oidcToken)

    if (result === SeedlessUserRegistrationResult.APPROVED) {
      setIsLoading(false)
      navigation.navigate(AppNavigation.Onboard.RecoveryMethods)
      Alert.alert('seedless user registration approved')
    } else if (result === SeedlessUserRegistrationResult.ALREADY_REGISTERED) {
      // todo: implement totp verification flow
      // CP-7664: https://ava-labs.atlassian.net/browse/CP-7664
      setIsLoading(false)
      Alert.alert('seedless user already registered')
    } else if (result === SeedlessUserRegistrationResult.ERROR) {
      setIsLoading(false)
      Alert.alert('seedless user registration error')
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: '',
      headerBackTitle: 'Sign Up',
      headerTintColor: colors.$blueMain
    })
  }, [navigation, colors])

  return (
    <View sx={{ flex: 1, backgroundColor: '$black' }}>
      <View
        sx={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <CoreXLogoAnimated size={180} />
      </View>
      <View
        sx={{
          padding: 16,
          marginBottom: 46
        }}>
        <AuthButtons
          title="Sign in with..."
          disabled={isLoading}
          onGoogleAction={handleSigninWithGoogle}
          onMnemonicAction={handleSigninWithMnemonic}
        />
      </View>
      <View />
    </View>
  )
}

export default SigninScreen
