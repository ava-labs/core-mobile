import { View, Button, useTheme, Logos, SafeAreaView } from '@avalabs/k2-alpine'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  selectIsSeedlessOnboardingAppleBlocked,
  selectIsSeedlessOnboardingBlocked,
  selectIsSeedlessOnboardingGoogleBlocked
} from 'store/posthog'
import { MFA } from 'seedless/types'
import AppleSignInService from 'services/socialSignIn/apple/AppleSignInService'
import GoogleSigninService from 'services/socialSignIn/google/GoogleSigninService'
import { OidcProviders } from 'seedless/consts'
import { router } from 'expo-router'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { showSnackbar } from 'common/utils/toast'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { useLogoModal } from 'common/hooks/useLogoModal'
import { useSeedlessRegister } from 'features/onboarding/hooks/useSeedlessRegister'

export default function Signup(): JSX.Element {
  const { theme } = useTheme()
  const { showLogoModal, hideLogoModal } = useLogoModal()
  const { setOidcAuth, setMfaMethods, resetSeedlessAuth } =
    useRecoveryMethodContext()
  const isSeedlessOnboardingBlocked = useSelector(
    selectIsSeedlessOnboardingBlocked
  )

  const { register, isRegistering } = useSeedlessRegister()

  useEffect(() => {
    isRegistering ? showLogoModal() : hideLogoModal()
  }, [hideLogoModal, isRegistering, showLogoModal])

  const handleSignupWithMnemonic = (): void => {
    // @ts-ignore TODO: make routes typesafe
    router.navigate('/onboarding/mnemonic/termsAndConditions')
    AnalyticsService.capture('RecoveryPhraseClicked')
  }

  const handleAccessExistingWallet = (): void => {
    // @ts-ignore TODO: make routes typesafe
    router.navigate('/accessWallet')
    AnalyticsService.capture('AccessExistingWalletClicked')
  }

  const handleRegisterMfaMethods = (oidcAuth?: {
    oidcToken: string
    mfaId: string
  }): void => {
    setOidcAuth(oidcAuth)
    // @ts-ignore TODO: make routes typesafe
    router.navigate('/onboarding/seedless/termsAndConditions')
  }

  const handleAccountVerified = (): void => {
    router.navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/seedless/termsAndConditions',
      params: { recovering: 'true' }
    })
  }

  const handleVerifyMfaMethod = (
    oidcAuth: {
      oidcToken: string
      mfaId: string
    },
    mfaMethods: MFA[]
  ): void => {
    setOidcAuth(oidcAuth)
    setMfaMethods(mfaMethods)
    router.navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/seedless/termsAndConditions',
      params: { recovering: 'true' }
    })
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
          Access existing wallet
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
    resetSeedlessAuth()
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
    resetSeedlessAuth()
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
      style={{
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
