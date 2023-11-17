import { View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'
import Loader from 'components/Loader'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import React, { FC, useLayoutEffect, useState } from 'react'
import { Alert } from 'react-native'
import AuthButtons from 'seedless/components/AuthButtons'
import { useSeedlessRegister } from 'seedless/hooks/useSeedlessRegister'
import { SeedlessUserRegistrationResult } from 'seedless/services/CoreSeedlessAPIService'
import GoogleSigninService from 'seedless/services/GoogleSigninService'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.Signup
>['navigation']

const SigninScreen: FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const navigation = useNavigation<NavigationProp>()
  const {
    theme: { colors }
  } = useTheme()
  const { register, isRegistering } = useSeedlessRegister()
  const loading = isRegistering || isLoading

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

    const result = await register(oidcToken)

    if (result === SeedlessUserRegistrationResult.ERROR) {
      Alert.alert('seedless user registration error')
      return
    }

    setIsLoading(true)
    if (result === SeedlessUserRegistrationResult.APPROVED) {
      navigation.navigate(AppNavigation.Onboard.RecoveryMethods)
    } else if (result === SeedlessUserRegistrationResult.ALREADY_REGISTERED) {
      const userMfa = await SeedlessService.userMfa()
      if (userMfa.length === 0) {
        setIsLoading(false)
        navigation.navigate(AppNavigation.Onboard.RecoveryMethods)
        return
      }
      // @ts-ignore
      navigation.navigate(AppNavigation.Onboard.RecoveryMethods, {
        screen: AppNavigation.RecoveryMethods.VerifyCode
      })
    }
    setIsLoading(false)
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: !loading,
      title: '',
      headerBackTitle: 'Sign Up',
      headerTintColor: colors.$blueMain
    })
  }, [navigation, colors, loading])

  return (
    <View sx={{ flex: 1, backgroundColor: '$black' }}>
      {isRegistering && (
        <View
          sx={{
            backgroundColor: '$transparent',
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }}>
          <Loader />
        </View>
      )}
      <View
        sx={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <CoreXLogoAnimated size={180} />
      </View>
      {!loading && (
        <View
          sx={{
            padding: 16,
            marginBottom: 46
          }}>
          <AuthButtons
            title="Sign in with..."
            disabled={isRegistering}
            onGoogleAction={() => {
              handleSigninWithGoogle().catch(error => {
                Alert.alert('seedless user registration error')
                Logger.error('handleSignupWithGoogle', error)
              })
            }}
            onMnemonicAction={handleSigninWithMnemonic}
          />
        </View>
      )}
      <View />
    </View>
  )
}

export default SigninScreen
