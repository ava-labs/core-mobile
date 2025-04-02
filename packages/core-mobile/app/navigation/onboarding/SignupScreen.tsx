import { Button, View } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import React, { FC, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useSeedlessRegister } from 'seedless/hooks/useSeedlessRegister'
import {
  selectIsSeedlessOnboardingAppleBlocked,
  selectIsSeedlessOnboardingBlocked,
  selectIsSeedlessOnboardingGoogleBlocked
} from 'store/posthog'
import { OidcProviders } from 'seedless/consts'
import { MFA } from 'seedless/types'
import AppleSignInService from 'services/socialSignIn/apple/AppleSignInService'
import GoogleSigninService from 'services/socialSignIn/google/GoogleSigninService'
import { showSimpleToast } from 'components/Snackbar'
import { hideLogo, showLogo } from 'components/GlobalLogoLoader'
import AnalyticsService from 'services/analytics/AnalyticsService'
import SeedlessService from 'seedless/services/SeedlessService'
import CoreLogo from '../../assets/icons/core.svg'

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.Signup
>['navigation']

const SignupScreen: FC = () => {
  const isSeedlessOnboardingBlocked = useSelector(
    selectIsSeedlessOnboardingBlocked
  )
  const { navigate } = useNavigation<NavigationProp>()
  const { register, isRegistering, verify } = useSeedlessRegister()

  useEffect(() => {
    isRegistering ? showLogo() : hideLogo()
  }, [isRegistering])

  const handleSignupWithMnemonic = (): void => {
    navigate(AppNavigation.Onboard.Welcome, {
      screen: AppNavigation.Onboard.AnalyticsConsent,
      params: {
        nextScreen: AppNavigation.Onboard.CreateWalletStack
      }
    })
    AnalyticsService.capture('RecoveryPhraseClicked')
  }

  const handleAccessExistingWallet = (): void => {
    navigate(AppNavigation.Onboard.AccessMnemonicWallet)
    AnalyticsService.capture('AccessExistingWalletClicked')
  }

  const handleAccountVerified = async (): Promise<void> => {
    showLogo()
    const walletName = await SeedlessService.getAccountName()
    hideLogo()
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

  const renderMnemonicOnboarding = (): JSX.Element => {
    return (
      <View sx={{ gap: 16 }}>
        <Button
          testID="manually_create_new_wallet_button"
          type="secondary"
          size="large"
          onPress={handleSignupWithMnemonic}>
          Manually Create New Wallet
        </Button>
        <Button
          testID="accessExistingWallet"
          type="secondary"
          size="large"
          onPress={handleAccessExistingWallet}>
          Access Existing Wallet
        </Button>
      </View>
    )
  }

  const isSeedlessOnboardingAppleBlocked = useSelector(
    selectIsSeedlessOnboardingAppleBlocked
  )
  const isSeedlessOnboardingGoogleBlocked = useSelector(
    selectIsSeedlessOnboardingGoogleBlocked
  )

  const shouldShowGoogle = !isSeedlessOnboardingGoogleBlocked
  const shouldShowApple =
    !isSeedlessOnboardingAppleBlocked && AppleSignInService.isSupported()

  const handleGoogleSignin = (): void => {
    register({
      getOidcToken: GoogleSigninService.signin,
      oidcProvider: OidcProviders.GOOGLE,
      onRegisterMfaMethods: handleRegisterMfaMethods,
      onVerifyMfaMethod: handleVerifyMfaMethod,
      onAccountVerified: handleAccountVerified
    }).catch(() => {
      showSimpleToast('Unable to sign up with Google')
    })
  }

  const handleAppleSignin = (): void => {
    register({
      getOidcToken: AppleSignInService.signIn,
      oidcProvider: OidcProviders.APPLE,
      onRegisterMfaMethods: handleRegisterMfaMethods,
      onVerifyMfaMethod: handleVerifyMfaMethod,
      onAccountVerified: handleAccountVerified
    }).catch(() => {
      showSimpleToast('Unable to sign up with Apple')
    })
  }

  const renderSeedlessOnboarding = (): JSX.Element => {
    return (
      <View sx={{ gap: 16 }}>
        {shouldShowGoogle && (
          <Button
            testID="continueWithGoogle"
            type="primary"
            size="large"
            disabled={isRegistering}
            leftIcon="google"
            onPress={handleGoogleSignin}>
            Continue with Google
          </Button>
        )}
        {shouldShowApple && (
          <Button
            testID="continueWithApple"
            type="primary"
            size="large"
            disabled={isRegistering}
            leftIcon="apple"
            onPress={handleAppleSignin}>
            Continue with Apple
          </Button>
        )}
      </View>
    )
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
        <CoreLogo width={180} />
      </View>
      <View sx={{ padding: 16, marginBottom: 46, gap: 35 }}>
        {!isSeedlessOnboardingBlocked && renderSeedlessOnboarding()}
        {renderMnemonicOnboarding()}
      </View>
    </View>
  )
}

export default SignupScreen
