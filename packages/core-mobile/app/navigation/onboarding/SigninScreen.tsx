import { View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'
import { showSimpleToast } from 'components/Snackbar'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import React, { FC, useEffect, useLayoutEffect } from 'react'
import AuthButtons from 'seedless/components/AuthButtons'
import { useSeedlessRegister } from 'seedless/hooks/useSeedlessRegister'
import { MFA } from 'seedless/types'
import AppleSignInService from 'services/socialSignIn/apple/AppleSignInService'
import GoogleSigninService from 'services/socialSignIn/google/GoogleSigninService'
import { OidcProviders } from 'seedless/consts'
import { hideOwl, showOwl } from 'components/GlobalOwlLoader'
import AnalyticsService from 'services/analytics/AnalyticsService'
import SeedlessService from 'seedless/services/SeedlessService'

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.Signin
>['navigation']

const SigninScreen: FC = () => {
  const { navigate, setOptions } = useNavigation<NavigationProp>()
  const {
    theme: { colors }
  } = useTheme()
  const { register, isRegistering, verify } = useSeedlessRegister()

  const handleSigninWithMnemonic = (): void => {
    navigate(AppNavigation.Onboard.Welcome, {
      screen: AppNavigation.Onboard.AnalyticsConsent,
      params: {
        nextScreen: AppNavigation.Onboard.EnterWithMnemonicStack
      }
    })
    AnalyticsService.capture('SignInWithRecoveryPhraseClicked')
  }

  const handleAccountVerified = async (): Promise<void> => {
    showOwl()
    const walletName = await SeedlessService.getAccountName()
    hideOwl()
    if (walletName) {
      navigate(AppNavigation.Root.Onboard, {
        screen: AppNavigation.Onboard.Welcome,
        params: {
          screen: AppNavigation.Onboard.AnalyticsConsent,
          params: {
            nextScreen: AppNavigation.Onboard.CreatePin
          }
        }
      })
      return
    }
    navigate(AppNavigation.Onboard.NameYourWallet)
  }

  const handleRegisterMfaMethods = (oidcAuth?: {
    oidcToken: string
    mfaId: string
  }): void => {
    navigate(AppNavigation.Root.RecoveryMethods, {
      screen: AppNavigation.RecoveryMethods.AddRecoveryMethods,
      params: {
        oidcAuth,
        onAccountVerified: handleAccountVerified,
        allowsUserToAddLater: true
      }
    })
  }

  const handleVerifyMfaMethod = (
    oidcAuth: {
      oidcToken: string
      mfaId: string
    },
    mfaMethods: MFA[]
  ): void => {
    navigate(AppNavigation.Root.SelectRecoveryMethods, {
      mfaMethods,
      onMFASelected: mfa => {
        verify(mfa, oidcAuth, handleAccountVerified)
      }
    })
  }

  useEffect(() => {
    isRegistering ? showOwl() : hideOwl()
  }, [isRegistering])

  useLayoutEffect(() => {
    setOptions({
      headerShown: true,
      title: '',
      headerBackTitle: 'Sign Up',
      headerTintColor: colors.$blueMain
    })
  }, [setOptions, colors, isRegistering])

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
              register({
                getOidcToken: GoogleSigninService.signin,
                oidcProvider: OidcProviders.GOOGLE,
                onRegisterMfaMethods: handleRegisterMfaMethods,
                onVerifyMfaMethod: handleVerifyMfaMethod,
                onAccountVerified: handleAccountVerified
              }).catch(() => {
                showSimpleToast('Unable to sign in with Google')
              })
            }}
            onAppleAction={() => {
              register({
                getOidcToken: AppleSignInService.signIn,
                oidcProvider: OidcProviders.APPLE,
                onRegisterMfaMethods: handleRegisterMfaMethods,
                onVerifyMfaMethod: handleVerifyMfaMethod,
                onAccountVerified: handleAccountVerified
              }).catch(() => {
                showSimpleToast('Unable to sign in with Apple')
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
