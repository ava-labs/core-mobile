import React, { useCallback } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CreatePin as Component } from 'features/onboarding/components/CreatePin'
import { useWallet } from 'hooks/useWallet'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { KeyboardAvoidingView } from 'common/components/KeyboardAvoidingView'
import BiometricsSDK from 'utils/BiometricsSDK'
import { useStoredBiometrics } from 'common/hooks/useStoredBiometrics'

export default function CreatePin(): JSX.Element {
  const { navigate } = useRouter()
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>()
  const { onPinCreated } = useWallet()
  const { isBiometricAvailable, useBiometrics, setUseBiometrics } =
    useStoredBiometrics()

  const handleEnteredValidPin = useCallback(
    (pin: string): void => {
      if (!mnemonic) {
        return
      }
      AnalyticsService.capture('OnboardingPasswordSet')
      onPinCreated(mnemonic, pin, false)
        .then(() => {
          if (useBiometrics) {
            BiometricsSDK.storeWalletWithBiometry(mnemonic)
          }
          navigate({
            // @ts-ignore TODO: make routes typesafe
            pathname: '/onboarding/mnemonic/setWalletName',
            params: { mnemonic }
          })
        })
        .catch(Logger.error)
    },
    [mnemonic, navigate, onPinCreated, useBiometrics]
  )

  return (
    <BlurredBarsContentLayout sx={{ marginTop: 16 }}>
      <KeyboardAvoidingView>
        <Component
          onEnteredValidPin={handleEnteredValidPin}
          useBiometrics={useBiometrics}
          setUseBiometrics={setUseBiometrics}
          newPinTitle={`Secure your wallet\nwith a PIN`}
          newPinDescription="For extra security, avoid choosing a PIN that contains repeating digits in a sequential order"
          confirmPinTitle={`Confirm your\nPIN code`}
          isBiometricAvailable={isBiometricAvailable}
        />
      </KeyboardAvoidingView>
    </BlurredBarsContentLayout>
  )
}
