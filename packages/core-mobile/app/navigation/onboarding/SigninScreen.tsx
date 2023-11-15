import { View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import React, { FC, useLayoutEffect, useState } from 'react'
import { Alert } from 'react-native'
import AuthButtons from 'seedless/components/AuthButtons'
import { SeedlessUserRegistrationResult } from 'seedless/services/CoreSeedlessAPIService'
import GoogleSigninService from 'seedless/services/GoogleSigninService'
import SeedlessService from 'seedless/services/SeedlessService'
import { seedlessRegister } from 'seedless/utils/seedlessRegister'

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

  const handleSigninWithGoogle = async (): Promise<void> => {
    const oidcToken = await GoogleSigninService.signin()

    setIsLoading(true)

    const result = await seedlessRegister(oidcToken)

    if (result === SeedlessUserRegistrationResult.ERROR) {
      setIsLoading(false)
      Alert.alert('seedless user registration error')
      return
    }

    if (result === SeedlessUserRegistrationResult.APPROVED) {
      setIsLoading(false)
      navigation.navigate(AppNavigation.Onboard.RecoveryMethods)
    } else if (result === SeedlessUserRegistrationResult.ALREADY_REGISTERED) {
      setIsLoading(false)

      const userMfa = await SeedlessService.userMfa()
      if (userMfa.length === 0) {
        navigation.navigate(AppNavigation.Onboard.RecoveryMethods)
        return
      }
      // @ts-ignore
      navigation.navigate(AppNavigation.Onboard.RecoveryMethods, {
        screen: AppNavigation.RecoveryMethods.VerifyCode
      })
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
