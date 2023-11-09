import { Button, View } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'
import { Space } from 'components/Space'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import React, { FC } from 'react'
import { StyleSheet } from 'react-native'
import { useSelector } from 'react-redux'
import { selectIsSeedlessOnboardingBlocked } from 'store/posthog'

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.Signup
>['navigation']

const SignupScreen: FC = () => {
  const isSeedlessOnboardingBlocked = useSelector(
    selectIsSeedlessOnboardingBlocked
  )
  const navigation = useNavigation<NavigationProp>()

  const handleLogin = (): void => {
    navigation.navigate(AppNavigation.Onboard.Welcome, {
      screen: AppNavigation.Onboard.AnalyticsConsent,
      params: {
        nextScreen: AppNavigation.Onboard.EnterWithMnemonicStack
      }
    })
  }

  const handleSignup = (): void => {
    navigation.navigate(AppNavigation.Onboard.Welcome, {
      screen: AppNavigation.Onboard.AnalyticsConsent,
      params: {
        nextScreen: AppNavigation.Onboard.CreateWalletStack
      }
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <CoreXLogoAnimated size={180} />
      </View>
      {isSeedlessOnboardingBlocked ? (
        <View style={styles.buttonsContainer}>
          <Button type="primary" size="xlarge" onPress={handleLogin}>
            Sign in with Recovery Phrase
          </Button>
          <Space y={16} />
          <Button type="secondary" size="xlarge" onPress={handleSignup}>
            Sign up with Recovery Phrase
          </Button>
        </View>
      ) : (
        <View style={styles.buttonsContainer} />
      )}
      <View />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
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
