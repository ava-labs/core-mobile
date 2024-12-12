import { View, Button, useTheme, SafeAreaView, Logos } from '@avalabs/k2-alpine'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  selectIsSeedlessOnboardingAppleBlocked,
  selectIsSeedlessOnboardingBlocked,
  selectIsSeedlessOnboardingGoogleBlocked
} from 'store/posthog'
import { useSeedlessRegister } from 'seedless/hooks/useSeedlessRegister'
import SeedlessService from 'seedless/services/SeedlessService'
import { MFA } from 'seedless/types'
import AppleSignInService from 'services/socialSignIn/apple/AppleSignInService'
import GoogleSigninService from 'services/socialSignIn/google/GoogleSigninService'
import { OidcProviders } from 'seedless/consts'
import { hideLogoModal, showLogoModal } from 'new/components/LogoModal'
import { router } from 'expo-router'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { showSnackbar } from 'new/utils/toast'

export default function Index(): JSX.Element {
  const { theme } = useTheme()
  const isSeedlessOnboardingBlocked = useSelector(
    selectIsSeedlessOnboardingBlocked
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { register, isRegistering, verify } = useSeedlessRegister()

  useEffect(() => {
    isRegistering ? showLogoModal() : hideLogoModal()
  }, [isRegistering])

  const handleSignupWithMnemonic = (): void => {
    // todo: CP-9604
    // navigate(AppNavigation.Onboard.Welcome, {
    //   screen: AppNavigation.Onboard.AnalyticsConsent,
    //   params: {
    //     nextScreen: AppNavigation.Onboard.CreateWalletStack
    //   }
    // })
    // AnalyticsService.capture('RecoveryPhraseClicked')
  }

  const handleAccessExistingWallet = (): void => {
    router.navigate('./accessWallet/')
    AnalyticsService.capture('AccessExistingWalletClicked')
  }

  const handleAccountVerified = async (): Promise<void> => {
    showLogoModal()
    const walletName = await SeedlessService.getAccountName()
    hideLogoModal()
    if (walletName) {
      // navigate(AppNavigation.Root.Onboard, {
      //   screen: AppNavigation.Onboard.Welcome,
      //   params: {
      //     screen: AppNavigation.Onboard.AnalyticsConsent,
      //     params: {
      //       nextScreen: AppNavigation.Onboard.CreatePin
      //     }
      //   }
      // })
      // return
    }
    // navigate(AppNavigation.Onboard.NameYourWallet)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRegisterMfaMethods = (oidcAuth?: {
    oidcToken: string
    mfaId: string
  }): void => {
    // navigate(AppNavigation.Root.RecoveryMethods, {
    //   screen: AppNavigation.RecoveryMethods.AddRecoveryMethods,
    //   params: {
    //     oidcAuth,
    //     onAccountVerified: handleAccountVerified,
    //     allowsUserToAddLater: true
    //   }
    // })
  }

  const handleVerifyMfaMethod = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    oidcAuth: {
      oidcToken: string
      mfaId: string
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mfaMethods: MFA[]
  ): void => {
    // navigate(AppNavigation.Root.SelectRecoveryMethods, {
    //   mfaMethods,
    //   onMFASelected: mfa => {
    //     verify(mfa, oidcAuth, handleAccountVerified)
    //   }
    // })
  }

  const renderMnemonicOnboarding = (): JSX.Element => {
    return (
      <View sx={{ gap: 16 }}>
        <Button
          testID="manually_create_new_wallet_button"
          type="primary"
          size="large"
          onPress={handleSignupWithMnemonic}>
          Manually create new wallet
        </Button>
        <Button
          testID="accessExistingWallet"
          type="tertiary"
          size="large"
          onPress={handleAccessExistingWallet}>
          Access existing Wallet
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
      showSnackbar('Unable to sign up with Google')
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
      showSnackbar('Unable to sign up with Apple')
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
            Sign in with Google
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
            Sign in with Apple
          </Button>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView
      sx={{
        flex: 1
      }}>
      <View sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Logos.Core color={theme.colors.$textPrimary} />
      </View>
      <View sx={{ padding: 16, gap: 88 }}>
        {!isSeedlessOnboardingBlocked && renderSeedlessOnboarding()}
        {renderMnemonicOnboarding()}
      </View>
    </SafeAreaView>
  )
}
