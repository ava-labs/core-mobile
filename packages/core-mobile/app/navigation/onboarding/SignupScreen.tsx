import { Button, View } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'
import Loader from 'components/Loader'
import { Space } from 'components/Space'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import React, { FC, useState } from 'react'
import { Alert } from 'react-native'
import { useSelector } from 'react-redux'
import AuthButtons from 'seedless/components/AuthButtons'
import { useSeedlessRegister } from 'seedless/hooks/useSeedlessRegister'
import { SeedlessUserRegistrationResult } from 'seedless/services/CoreSeedlessAPIService'
import GoogleSigninService from 'seedless/services/GoogleSigninService'
import SeedlessService from 'seedless/services/SeedlessService'
import { selectIsSeedlessOnboardingBlocked } from 'store/posthog'
import Logger from 'utils/Logger'

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.Signup
>['navigation']

const SignupScreen: FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const isSeedlessOnboardingBlocked = useSelector(
    selectIsSeedlessOnboardingBlocked
  )
  const navigation = useNavigation<NavigationProp>()
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

  const handleSignupWithMnemonic = (): void => {
    navigation.navigate(AppNavigation.Onboard.Welcome, {
      screen: AppNavigation.Onboard.AnalyticsConsent,
      params: {
        nextScreen: AppNavigation.Onboard.CreateWalletStack
      }
    })
  }

  const handleSignin = (): void => {
    navigation.navigate(AppNavigation.Onboard.Signin)
  }

  const handleSignupWithGoogle = async (): Promise<void> => {
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
        navigation.navigate(AppNavigation.Onboard.RecoveryMethods)
        setIsLoading(false)
        return
      }
      // @ts-ignore
      navigation.navigate(AppNavigation.Onboard.RecoveryMethods, {
        screen: AppNavigation.RecoveryMethods.VerifyCode
      })
    }
    setIsLoading(false)
  }

  return (
    <View
      sx={{
        flex: 1,
        backgroundColor: '$black'
      }}>
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
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <CoreXLogoAnimated size={180} />
      </View>
      {!loading && (
        <View sx={{ padding: 16, marginBottom: 46 }}>
          {isSeedlessOnboardingBlocked ? (
            <>
              <Button
                type="primary"
                size="xlarge"
                onPress={handleSigninWithMnemonic}>
                Forgot PIN?
              </Button>
              <Space y={16} />
              <Button
                type="secondary"
                size="xlarge"
                onPress={handleSignupWithMnemonic}>
                Sign up with Recovery Phrase
              </Button>
            </>
          ) : (
            <>
              <AuthButtons
                title="Sign up with..."
                disabled={isRegistering}
                onGoogleAction={() => {
                  handleSignupWithGoogle().catch(error => {
                    Alert.alert('seedless user registration error')
                    Logger.error('handleSignupWithGoogle', error)
                  })
                }}
                onMnemonicAction={handleSignupWithMnemonic}
              />
              <Space y={48} />
              <Button
                type="tertiary"
                size="xlarge"
                disabled={isRegistering}
                onPress={handleSignin}>
                Already Have a Wallet?
              </Button>
            </>
          )}
        </View>
      )}
    </View>
  )
}

export default SignupScreen
