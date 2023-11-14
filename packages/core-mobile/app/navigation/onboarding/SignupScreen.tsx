import { Button, View } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'
import { Space } from 'components/Space'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import React, { FC, useState } from 'react'
import { useSelector } from 'react-redux'
import AuthButtons from 'seedless/components/AuthButtons'
import { useSignInWithGoogle } from 'seedless/hooks/useSignInWithGoogle'
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
  const { signInWithGoogle } = useSignInWithGoogle()

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
              onGoogleAction={() => signInWithGoogle(setIsLoading)}
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
