import { View, Button, useTheme, SafeAreaView, Logos } from '@avalabs/k2-alpine'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  selectIsSeedlessOnboardingAppleBlocked,
  selectIsSeedlessOnboardingBlocked,
  selectIsSeedlessOnboardingGoogleBlocked
} from 'store/posthog'
import { useSeedlessRegister } from 'seedless/hooks/useSeedlessRegister'
import { MFA } from 'seedless/types'
import AppleSignInService from 'services/socialSignIn/apple/AppleSignInService'
import GoogleSigninService from 'services/socialSignIn/google/GoogleSigninService'
import { OidcProviders } from 'seedless/consts'
import { hideLogoModal, showLogoModal } from 'common/components/LogoModal'
import { router } from 'expo-router'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { showSnackbar } from 'common/utils/toast'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'

export default function Signup(): JSX.Element {
  const { theme } = useTheme()
  const { setOidcAuth } = useRecoveryMethodContext()
  const isSeedlessOnboardingBlocked = useSelector(
    selectIsSeedlessOnboardingBlocked
  )

  const { register, isRegistering } = useSeedlessRegister()

  useEffect(() => {
    isRegistering ? showLogoModal() : hideLogoModal()
  }, [isRegistering])

  const handleSignupWithMnemonic = (): void => {
    router.navigate('/onboarding/mnemonic/termsAndConditions')
    AnalyticsService.capture('RecoveryPhraseClicked')
  }

  const handleAccessExistingWallet = (): void => {
    router.navigate('/accessWallet')
    AnalyticsService.capture('AccessExistingWalletClicked')
  }

  const handleRegisterMfaMethods = (oidcAuth?: {
    oidcToken: string
    mfaId: string
  }): void => {
    setOidcAuth(oidcAuth)
    router.navigate('/onboarding/seedless/termsAndConditions')
  }

  const handleAccountVerified = (): void => {
    router.navigate('/onboarding/seedless/termsAndConditions')
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
    <SafeAreaView
      sx={{
        flex: 1
      }}>
      <View sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Logos.AppIcons.Core color={theme.colors.$textPrimary} />
      </View>
      <View sx={{ padding: 16, gap: 88 }}>
        {!isSeedlessOnboardingBlocked && renderSeedlessOnboarding()}
        {renderMnemonicOnboarding()}
      </View>
    </SafeAreaView>
  )
}
