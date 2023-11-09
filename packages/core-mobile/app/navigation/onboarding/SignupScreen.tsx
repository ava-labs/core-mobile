import { Button, View } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'
import { Space } from 'components/Space'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import React, { FC, useState } from 'react'
import { Alert, StyleSheet } from 'react-native'
import { useSelector } from 'react-redux'
import AuthButtons from 'seedless/components/AuthButtons'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import GoogleSigninService from 'seedless/services/GoogleSigninService'
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

  const handleSignupWithGoogle = async (): Promise<void> => {
    const oidcToken = await GoogleSigninService.signin()

    setIsLoading(true)
    const result = await CoreSeedlessAPIService.register(oidcToken)

    if (result === SeedlessUserRegistrationResult.APPROVED) {
      // todo: implement totp registration flow
      // CP-7663: https://ava-labs.atlassian.net/browse/CP-7663
      setIsLoading(false)
      Alert.alert('seedless user registration approved')
    } else if (result === SeedlessUserRegistrationResult.ALREADY_REGISTERED) {
      // todo: implement totp verification flow
      // CP-7664: https://ava-labs.atlassian.net/browse/CP-7664
      setIsLoading(false)
    }
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
            disabled={isLoading}
            onGoogleAction={handleSignupWithGoogle}
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
