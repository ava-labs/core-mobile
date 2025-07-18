import { useStoredBiometrics } from 'common/hooks/useStoredBiometrics'
import { useRouter } from 'expo-router'
import { CreatePin as Component } from 'features/onboarding/components/CreatePin'
import { useWallet } from 'hooks/useWallet'
import React, { useCallback, useEffect, useState } from 'react'
import { WalletType } from 'services/wallet/types'
import SeedlessService from 'seedless/services/SeedlessService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import { uuid } from 'utils/uuid'
import { useSelector } from 'react-redux'
import { selectActiveWalletId } from 'store/wallet/slice'

export default function CreatePin(): JSX.Element {
  const { navigate, back } = useRouter()
  const { onPinCreated } = useWallet()
  const [hasWalletName, setHasWalletName] = useState(false)
  const { isBiometricAvailable, useBiometrics, setUseBiometrics } =
    useStoredBiometrics()
  const activeWalletId = useSelector(selectActiveWalletId)

  const navigateToNextStep = useCallback(() => {
    if (hasWalletName) {
      // @ts-ignore TODO: make routes typesafe
      navigate('/onboarding/seedless/selectAvatar')
    } else {
      // @ts-ignore TODO: make routes typesafe
      navigate('/onboarding/seedless/setWalletName')
    }
  }, [navigate, hasWalletName])

  useEffect(() => {
    const checkHasWalletName = async (): Promise<void> => {
      const walletName = await SeedlessService.getAccountName()
      setHasWalletName(walletName !== undefined)
    }
    checkHasWalletName().catch(Logger.error)
  }, [])

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
                  back()
                }
              })
              .catch(Logger.error)
          } else {
            navigateToNextStep()
          }
        })
        .catch(Logger.error)
    },
    [onPinCreated, useBiometrics, navigateToNextStep, back, activeWalletId]
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
