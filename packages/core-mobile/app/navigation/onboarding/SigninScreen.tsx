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
import Logger from 'utils/Logger'
import { OidcProviders } from 'seedless/consts'
import { hideOwl, showOwl } from 'components/GlobalOwlLoader'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Result } from 'types/result'
import { TotpErrors } from 'seedless/errors'
import SeedlessService from 'seedless/services/SeedlessService'

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.Signin
>['navigation']

const SigninScreen: FC = () => {
  const { navigate, setOptions } = useNavigation<NavigationProp>()
  const {
    theme: { colors }
  } = useTheme()
  const { register, isRegistering } = useSeedlessRegister()

  const handleSigninWithMnemonic = (): void => {
    navigate(AppNavigation.Onboard.Welcome, {
      screen: AppNavigation.Onboard.AnalyticsConsent,
      params: {
        nextScreen: AppNavigation.Onboard.EnterWithMnemonicStack
      }
    })
    AnalyticsService.capture('SignInWithRecoveryPhraseClicked')
  }

  const handleAccountVerified = (): void => {
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

  const handleVerifyTotpCode = (
    oidcToken: string,
    mfaId: string,
    code: string
  ): Promise<Result<undefined, TotpErrors>> => {
    return SeedlessService.sessionManager.verifyCode(oidcToken, mfaId, code)
  }

  const handleVerifyFido = (
    oidcToken: string,
    mfaId: string
  ): Promise<void> => {
    return SeedlessService.sessionManager.approveFido(oidcToken, mfaId, false)
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
      onAccountVerified: handleAccountVerified,
      onVerifyTotpCode: code =>
        handleVerifyTotpCode(oidcAuth.oidcToken, oidcAuth.mfaId, code),
      onVerifyFido: () => handleVerifyFido(oidcAuth.oidcToken, oidcAuth.mfaId)
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
                onVerifyMfaMethod: handleVerifyMfaMethod
              }).catch(error => {
                Logger.error('Unable to sign in with Google: ', error)
                showSimpleToast('Unable to sign in with Google')
              })
            }}
            onAppleAction={() => {
              register({
                getOidcToken: AppleSignInService.signIn,
                oidcProvider: OidcProviders.APPLE,
                onRegisterMfaMethods: handleRegisterMfaMethods,
                onVerifyMfaMethod: handleVerifyMfaMethod
              }).catch(error => {
                Logger.error('Unable to sign in with Apple: ', error)
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
