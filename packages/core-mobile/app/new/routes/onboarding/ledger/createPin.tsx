import { useStoredBiometrics } from 'common/hooks/useStoredBiometrics'
import { useRouter } from 'expo-router'
import { CreatePin as Component } from 'features/onboarding/components/CreatePin'
import React, { useCallback } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'

export default function CreatePin(): JSX.Element {
  const { navigate } = useRouter()
  const { isBiometricAvailable, useBiometrics, setUseBiometrics } =
    useStoredBiometrics()

  const navigateToNextStep = useCallback(() => {
    navigate('/onboarding/ledger/pathSelection')
  }, [navigate])

  const handleEnteredValidPin = useCallback(
    (pin: string) => {
      AnalyticsService.capture('OnboardingPasswordSet')
      BiometricsSDK.generateEncryptionKey()
        .then(async encryptionKey => {
          await BiometricsSDK.storeEncryptionKeyWithPin(encryptionKey, pin)

          if (useBiometrics) {
            BiometricsSDK.enableBiometry()
              .then(enabled => {
                if (!enabled) {
                  setUseBiometrics(false)
                }
                navigateToNextStep()
              })
              .catch(error => {
                Logger.error(error)
                setUseBiometrics(false)
                navigateToNextStep()
              })
          } else {
            navigateToNextStep()
          }
        })
        .catch(Logger.error)
    },
    [useBiometrics, setUseBiometrics, navigateToNextStep]
  )

  return (
    <Component
      onEnteredValidPin={handleEnteredValidPin}
      useBiometrics={useBiometrics}
      setUseBiometrics={setUseBiometrics}
      newPinTitle={`Secure your wallet\nwith a PIN`}
      newPinDescription="For extra security, avoid choosing a PIN that contains repeating digits in a sequential order"
      confirmPinTitle={`Confirm your\nPIN code`}
      isBiometricAvailable={isBiometricAvailable}
    />
  )
}
