import { View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import React, { FC, useLayoutEffect } from 'react'
import { Alert } from 'react-native'
import AuthButtons from 'seedless/components/AuthButtons'
import { useSeedlessRegister } from 'seedless/hooks/useSeedlessRegister'
import GoogleSigninService from 'seedless/services/GoogleSigninService'
import Logger from 'utils/Logger'

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.Signin
>['navigation']

const SigninScreen: FC = () => {
  const navigation = useNavigation<NavigationProp>()
  const {
    theme: { colors }
  } = useTheme()
  const { register, isRegistering } = useSeedlessRegister()

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

    try {
      await register({
        oidcToken,
        onRegisterMfaMethods: mfaId => {
          navigation.navigate(AppNavigation.Onboard.RecoveryMethods, {
            screen: AppNavigation.RecoveryMethods.AddRecoveryMethods,
            oidcToken,
            mfaId
          })
        },
        onVerifyMfaMethod: mfaId => {
          navigation.navigate(AppNavigation.Onboard.RecoveryMethods, {
            screen: AppNavigation.RecoveryMethods.VerifyCode,
            oidcToken,
            mfaId
          })
        }
      })
    } catch (e) {
      Alert.alert('seedless user registration error')
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: !isRegistering,
      title: '',
      headerBackTitle: 'Sign Up',
      headerTintColor: colors.$blueMain
    })
  }, [navigation, colors, isRegistering])

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
      {!isRegistering && (
        <View
          sx={{
            padding: 16,
            marginBottom: 46
          }}>
          <AuthButtons
            title="Sign in with..."
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
