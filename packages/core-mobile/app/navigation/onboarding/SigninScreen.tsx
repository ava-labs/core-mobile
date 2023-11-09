import { View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import React, { FC, useLayoutEffect } from 'react'
import { StyleSheet } from 'react-native'
import AuthButtons from 'seedless/components/AuthButtons'

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.Signup
>['navigation']

const SigninScreen: FC = () => {
  const navigation = useNavigation<NavigationProp>()
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

  const handleSigninWithGoogle = (): void => {
    // todo: implement sign in with google
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
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <CoreXLogoAnimated size={180} />
      </View>
      <View style={styles.buttonsContainer}>
        <AuthButtons
          title="Sign in with..."
          onGoogleAction={handleSigninWithGoogle}
          onMnemonicAction={handleSigninWithMnemonic}
        />
      </View>
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

export default SigninScreen
