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

export default function CreatePin(): JSX.Element {
  const { navigate } = useRouter()
  const { onPinCreated } = useWallet()
  const [hasWalletName, setHasWalletName] = useState(false)
  const { isBiometricAvailable, useBiometrics, setUseBiometrics } =
    useStoredBiometrics()

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
        mnemonic: uuid(),
        pin,
        walletType: WalletType.SEEDLESS
      })
        .then(() => {
          if (useBiometrics) {
            BiometricsSDK.enableBiometry().catch(Logger.error)
          }
          if (hasWalletName) {
            // @ts-ignore TODO: make routes typesafe
            navigate('/onboarding/seedless/selectAvatar')
          } else {
            // @ts-ignore TODO: make routes typesafe
            navigate('/onboarding/seedless/setWalletName')
          }
        })
        .catch(Logger.error)
    },
    [hasWalletName, navigate, onPinCreated, useBiometrics]
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
