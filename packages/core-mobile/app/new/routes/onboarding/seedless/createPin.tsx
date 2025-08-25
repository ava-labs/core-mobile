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
    async (pin: string): Promise<void> => {
      AnalyticsService.capture('OnboardingPasswordSet')
      try {
        await onPinCreated({
          walletId: activeWalletId ?? uuid(),
          mnemonic: uuid(),
          pin,
          walletType: WalletType.SEEDLESS
        })
        if (useBiometrics) {
          const enabled = await BiometricsSDK.enableBiometry()
          setUseBiometrics(enabled)
        }
        navigateToNextStep()
      } catch (error) {
        Logger.error('Failed to create pin', error)
      }
    },
    [
      activeWalletId,
      onPinCreated,
      useBiometrics,
      navigateToNextStep,
      setUseBiometrics
    ]
  )

  return (
    <Component
      onEnteredValidPin={async (pin: string) =>
        await handleEnteredValidPin(pin)
      }
      useBiometrics={useBiometrics}
      setUseBiometrics={setUseBiometrics}
      newPinTitle={`Secure your wallet\nwith a PIN`}
      newPinDescription="For extra security, avoid choosing a PIN that contains repeating digits in a sequential order"
      confirmPinTitle={`Confirm your\nPIN code`}
      isBiometricAvailable={isBiometricAvailable}
    />
  )
}
