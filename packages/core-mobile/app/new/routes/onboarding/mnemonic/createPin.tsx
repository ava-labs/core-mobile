import { useStoredBiometrics } from 'common/hooks/useStoredBiometrics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CreatePin as Component } from 'features/onboarding/components/CreatePin'
import { useWallet } from 'hooks/useWallet'
import React, { useCallback } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import { WalletType } from 'services/wallet/types'

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
      onPinCreated({
        mnemonic,
        pin,
        isResetting: false,
        walletType: WalletType.MNEMONIC
      })
        .then(() => {
          if (useBiometrics) {
            //NEVEN - fix this
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
