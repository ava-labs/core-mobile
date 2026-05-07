import {
  View,
  Button,
  useTheme,
  Logos,
  SafeAreaView,
  Text
} from '@avalabs/k2-alpine'
import { LinearGradient } from 'expo-linear-gradient'
import { Image, ImageSourcePropType, StatusBar } from 'react-native'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  selectIsImportExistingWalletBlocked,
  selectIsMnemonicOnboardingBlocked,
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
import { isLimitedMode } from 'utils/limitedMode'

const NETWORK_ICONS: ImageSourcePropType[] = [
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('assets/icons/limited-mode/usdt.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('assets/icons/limited-mode/eth.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('assets/icons/limited-mode/btc.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('assets/icons/limited-mode/avax.png')
]

export default function Signup(): JSX.Element {
  const { theme } = useTheme()
  const { showLogoModal, hideLogoModal } = useLogoModal()
  const { setOidcAuth, setMfaMethods, resetSeedlessAuth } =
    useRecoveryMethodContext()
  const isSeedlessOnboardingBlocked = useSelector(
    selectIsSeedlessOnboardingBlocked
  )
  const isMnemonicOnboardingBlocked = useSelector(
    selectIsMnemonicOnboardingBlocked
  )
  const isImportExistingWalletBlocked = useSelector(
    selectIsImportExistingWalletBlocked
  )

  const { register, isRegistering } = useSeedlessRegister()

  useEffect(() => {
    isRegistering ? showLogoModal() : hideLogoModal()
  }, [hideLogoModal, isRegistering, showLogoModal])

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
    router.navigate({
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
        {!isImportExistingWalletBlocked && (
          <Button
            testID="accessExistingWallet"
            type="tertiary"
            size="large"
            onPress={handleAccessExistingWallet}>
            Access existing wallet
          </Button>
        )}
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

  if (isLimitedMode) {
    return (
      <View sx={{ flex: 1, backgroundColor: '$black' }}>
        <StatusBar barStyle="light-content" translucent />

        {/* Hero band fills the top 630dp with the lifestyle photo. The
            black gradient over the bottom half of the band keeps the
            headline + body legible against bright photo content. */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 630,
            overflow: 'hidden'
          }}>
          <Image
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            source={require('assets/icons/limited-mode/onboarding-hero.jpg')}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 270,
              height: 360
            }}
          />
        </View>

        {/* Use the raw safe-area-context view here — k2-alpine's styled
            SafeAreaView paints `$surfacePrimary` over everything, which
            would hide the hero photo. */}
        <RNSafeAreaView
          style={{ flex: 1, backgroundColor: 'transparent' }}
          edges={['top', 'bottom']}>
          {/* Hero copy block lands at ~344dp from top per Figma; using a
              flex spacer above so the layout still works on taller
              devices without hardcoding the exact y. */}
          <View sx={{ flex: 1 }} />
          <View sx={{ paddingHorizontal: 32, gap: 10 }}>
            <Logos.AppIcons.MotoTetherWing width={120} height={63} />
            <Text
              sx={{
                fontFamily: 'Rookery-Bold',
                fontSize: 60,
                lineHeight: 65,
                color: '#FFFFFF'
              }}>
              {'Crypto\nwallet'}
            </Text>
            <Text
              sx={{
                fontFamily: 'Rookery-Regular',
                fontSize: 16,
                lineHeight: 24,
                color: '#FFFFFF',
                width: 276
              }}>
              Securely buy, send, and manage digital assets like USDT in one
              place.
            </Text>
            <View
              sx={{ flexDirection: 'row', marginTop: 6 }}
              testID="supported_networks">
              {NETWORK_ICONS.map((source, i) => (
                <Image
                  key={i}
                  source={source}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: '#000000',
                    marginLeft: i === 0 ? 0 : -8
                  }}
                />
              ))}
            </View>
          </View>

          <View
            sx={{
              paddingHorizontal: 32,
              gap: 16,
              paddingBottom: 16,
              paddingTop: 32
            }}>
            {!isSeedlessOnboardingBlocked && shouldShowGoogle && (
              <Button
                testID="continueWithGoogle"
                type="primary"
                size="large"
                shouldInverseTheme
                disabled={isRegistering}
                leftIcon="google"
                numberOfLines={0}
                onPress={handleGoogleSignin}>
                Continue with Google
              </Button>
            )}
            {!isMnemonicOnboardingBlocked && (
              <Button
                testID="manually_create_new_wallet_button"
                type="primary"
                size="large"
                shouldInverseTheme
                numberOfLines={0}
                onPress={handleSignupWithMnemonic}>
                Manually create new wallet
              </Button>
            )}
            {!isImportExistingWalletBlocked && (
              <Button
                testID="accessExistingWallet"
                type="tertiary"
                size="large"
                numberOfLines={0}
                textStyle={{ color: '#FFFFFF' }}
                onPress={handleAccessExistingWallet}>
                Access existing wallet
              </Button>
            )}
          </View>
        </RNSafeAreaView>
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
      <View sx={{ padding: 16, gap: 16 }}>
        {!isSeedlessOnboardingBlocked && renderSeedlessOnboarding()}
        {!isMnemonicOnboardingBlocked && renderMnemonicOnboarding()}
      </View>
    </SafeAreaView>
  )
}
