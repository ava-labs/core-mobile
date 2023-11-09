import { Button, View } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'
import { Space } from 'components/Space'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import React, { FC } from 'react'
import { StyleSheet } from 'react-native'
import { useSelector } from 'react-redux'
import AuthButtons from 'seedless/components/AuthButtons'
import { selectIsSeedlessOnboardingBlocked } from 'store/posthog'

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.Signup
>['navigation']

const SignupScreen: FC = () => {
  const isSeedlessOnboardingBlocked = useSelector(
    selectIsSeedlessOnboardingBlocked
  )
  const navigation = useNavigation<NavigationProp>()

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

  const handleSignupWithGoogle = (): void => {
    // todo: implement sign up with google
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <CoreXLogoAnimated size={180} />
      </View>
      {isSeedlessOnboardingBlocked ? (
        <View style={styles.buttonsContainer}>
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
        </View>
      ) : (
        <View style={styles.buttonsContainer}>
          <AuthButtons
            title="Sign up with..."
            onGoogleAction={handleSignupWithGoogle}
            onMnemonicAction={handleSignupWithMnemonic}
          />
          <Space y={48} />
          <Button type="tertiary" size="xlarge" onPress={handleSignin}>
            Already Have a Wallet?
          </Button>
        </View>
      )}
      <View />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black'
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonsContainer: {
    padding: 16,
    marginBottom: 46
  }
})

export default SignupScreen
