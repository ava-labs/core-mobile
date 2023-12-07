import { Button, View } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'
import { Space } from 'components/Space'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import React, { FC, useEffect } from 'react'
import { useSelector } from 'react-redux'
import AuthButtons from 'seedless/components/AuthButtons'
import { useSeedlessRegister } from 'seedless/hooks/useSeedlessRegister'
import { selectIsSeedlessOnboardingBlocked } from 'store/posthog'
import Logger from 'utils/Logger'
import { OidcProviders } from 'seedless/consts'
import { MFA } from 'seedless/types'
import AppleSignInService from 'services/socialSignIn/apple/AppleSignInService'
import GoogleSigninService from 'services/socialSignIn/google/GoogleSigninService'
import { showSimpleToast } from 'components/Snackbar'
import { hideOwl, showOwl } from 'components/GlobalOwlLoader'

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.Signup
>['navigation']

const SignupScreen: FC = () => {
  const isSeedlessOnboardingBlocked = useSelector(
    selectIsSeedlessOnboardingBlocked
  )
  const { navigate } = useNavigation<NavigationProp>()
  const { register, isRegistering } = useSeedlessRegister()

  useEffect(() => {
    isRegistering ? showOwl() : hideOwl()
  }, [isRegistering])

  const handleSigninWithMnemonic = (): void => {
    navigate(AppNavigation.Onboard.Welcome, {
      screen: AppNavigation.Onboard.AnalyticsConsent,
      params: {
        nextScreen: AppNavigation.Onboard.EnterWithMnemonicStack
      }
    })
  }

  const handleSignupWithMnemonic = (): void => {
    navigate(AppNavigation.Onboard.Welcome, {
      screen: AppNavigation.Onboard.AnalyticsConsent,
      params: {
        nextScreen: AppNavigation.Onboard.CreateWalletStack
      }
    })
  }

  const handleSignin = (): void => {
    navigate(AppNavigation.Onboard.Signin)
  }

  const onRegisterMfaMethods = (oidcToken: string, mfaId: string): void => {
    navigate(AppNavigation.Onboard.RecoveryMethods, {
      screen: AppNavigation.RecoveryMethods.AddRecoveryMethods,
      oidcToken,
      mfaId
    })
  }

  const onVerifyMfaMethod = (
    oidcToken: string,
    mfaId: string,
    mfaMethods: MFA[]
  ): void => {
    navigate(AppNavigation.Onboard.RecoveryMethods, {
      screen: AppNavigation.RecoveryMethods.SelectRecoveryMethods,
      params: { mfaMethods },
      oidcToken,
      mfaId
    })
  }

  return (
    <View
      sx={{
        flex: 1,
        backgroundColor: '$black'
      }}>
      <View
        style={{
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
                register({
                  getOidcToken: GoogleSigninService.signin,
                  oidcProvider: OidcProviders.GOOGLE,
                  onRegisterMfaMethods,
                  onVerifyMfaMethod
                }).catch(error => {
                  Logger.error('Unable to sign up with Google: ', error)
                  showSimpleToast('Unable to sign up with Google')
                })
              }}
              onAppleAction={() => {
                register({
                  getOidcToken: AppleSignInService.signIn,
                  oidcProvider: OidcProviders.APPLE,
                  onRegisterMfaMethods,
                  onVerifyMfaMethod
                }).catch(error => {
                  Logger.error('Unable to sign up with Apple: ', error)
                  showSimpleToast('Unable to sign up with Apple')
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
    </View>
  )
}

export default SignupScreen
