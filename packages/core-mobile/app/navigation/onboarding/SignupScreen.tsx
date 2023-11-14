import { Button, View } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'
import { Space } from 'components/Space'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import React, { FC, useState } from 'react'
import { Alert } from 'react-native'
import { useSelector } from 'react-redux'
import AuthButtons from 'seedless/components/AuthButtons'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import GoogleSigninService from 'seedless/services/GoogleSigninService'
import SeedllessService from 'seedless/services/SeedllessService'
import { selectIsSeedlessOnboardingBlocked } from 'store/posthog'

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.Signup
>['navigation']

const SignupScreen: FC = () => {
  const isSeedlessOnboardingBlocked = useSelector(
    selectIsSeedlessOnboardingBlocked
  )
  const navigation = useNavigation<NavigationProp>()
  const [isLoading, setIsLoading] = useState(false)

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

  const handleSigninWithGoogle = async (): Promise<void> => {
    const oidcToken = await GoogleSigninService.signin()

    setIsLoading(true)
    const result = await CoreSeedlessAPIService.register(oidcToken)

    if (result === SeedlessUserRegistrationResult.APPROVED) {
      setIsLoading(false)
      navigation.navigate(AppNavigation.Onboard.RecoveryMethods)
    } else if (result === SeedlessUserRegistrationResult.ALREADY_REGISTERED) {
      setIsLoading(false)

      const userInfo = await SeedllessService.aboutMe(oidcToken)
      if (userInfo.mfa.length === 0) {
        navigation.navigate(AppNavigation.Onboard.RecoveryMethods)
        return
      }
      // @ts-ignore
      navigation.navigate(AppNavigation.Onboard.RecoveryMethods, {
        screen: AppNavigation.RecoveryMethods.VerifyCode
      })
    } else if (result === SeedlessUserRegistrationResult.ERROR) {
      setIsLoading(false)
      Alert.alert('seedless user registration error')
    }
  }

  return (
    <View
      sx={{
        flex: 1,
        backgroundColor: '$black'
      }}>
      <View
        sx={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <CoreXLogoAnimated size={180} />
      </View>
      <View sx={{ padding: 16, marginBottom: 46 }}>
        {isSeedlessOnboardingBlocked ? (
          <>
            <Button
              type="primary"
              size="xlarge"
              onPress={handleSigninWithMnemonic}>
              Sign in with Recovery Phrase
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
              disabled={isLoading}
              onGoogleAction={handleSigninWithGoogle}
              onMnemonicAction={handleSignupWithMnemonic}
            />
            <Space y={48} />
            <Button
              type="tertiary"
              size="xlarge"
              disabled={isLoading}
              onPress={handleSignin}>
              Already Have a Wallet?
            </Button>
          </>
        )}
      </View>
    </View>
  )
}

export default SignupScreen
