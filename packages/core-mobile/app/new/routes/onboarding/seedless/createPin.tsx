import { useStoredBiometrics } from 'common/hooks/useStoredBiometrics'
import { useRouter } from 'expo-router'
import { CreatePin as Component } from 'features/onboarding/components/CreatePin'
import { useWallet } from 'hooks/useWallet'
import React, { useCallback } from 'react'
import { WalletType } from 'services/wallet/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import { uuid } from 'utils/uuid'
import { useSelector } from 'react-redux'
import { selectActiveWalletId } from 'store/wallet/slice'

export default function CreatePin(): JSX.Element {
  const { navigate } = useRouter()
  const { onPinCreated } = useWallet()
  const { isBiometricAvailable, useBiometrics, setUseBiometrics } =
    useStoredBiometrics()
  const activeWalletId = useSelector(selectActiveWalletId)

  const navigateToNextStep = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/onboarding/seedless/setWalletName')
  }, [navigate])

  const handleEnteredValidPin = useCallback(
    (pin: string) => {
      AnalyticsService.capture('OnboardingPasswordSet')

      /**
       * we are using a dummy mnemonic here
       * even though we are creating a seedless wallet.
       * this allows our pin/biometric logic to work normally
       */
      onPinCreated({
        walletId: activeWalletId ?? uuid(),
        mnemonic: uuid(),
        pin,
        walletType: WalletType.SEEDLESS
      })
        .then(() => {
          if (useBiometrics) {
            BiometricsSDK.enableBiometry()
              .then(enabled => {
                if (enabled) {
                  navigateToNextStep()
                } else {
                  // If biometrics fails to enable, disable it and continue with PIN only
                  setUseBiometrics(false)
                  navigateToNextStep()
                }
              })
              .catch(error => {
                Logger.error(error)
                // On error, disable biometrics and continue with PIN only
                setUseBiometrics(false)
                navigateToNextStep()
              })
          } else {
            navigateToNextStep()
          }
        })
        .catch(Logger.error)
    },
    [
      onPinCreated,
      useBiometrics,
      setUseBiometrics,
      navigateToNextStep,
      activeWalletId
    ]
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
