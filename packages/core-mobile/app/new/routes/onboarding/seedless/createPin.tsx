import { useStoredBiometrics } from 'common/hooks/useStoredBiometrics'
import { useRouter } from 'expo-router'
import { CreatePin as Component } from 'features/onboarding/components/CreatePin'
import { useWallet } from 'hooks/useWallet'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { SEEDLESS_MNEMONIC_STUB } from 'seedless/consts'
import SeedlessService from 'seedless/services/SeedlessService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WalletType } from 'services/wallet/types'
import { selectWalletType } from 'store/app'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'

export default function CreatePin(): JSX.Element {
  const walletType = useSelector(selectWalletType)
  const { navigate } = useRouter()
  const { onPinCreated } = useWallet()
  const [hasWalletName, setHasWalletName] = useState(false)
  const { isBiometricAvailable, useBiometrics, setUseBiometrics } =
    useStoredBiometrics()

  useEffect(() => {
    const checkHasWalletName = async (): Promise<void> => {
      if (walletType === WalletType.SEEDLESS) {
        const walletName = await SeedlessService.getAccountName()
        setHasWalletName(walletName !== undefined ? true : false)
      } else {
        setHasWalletName(false)
      }
    }
    checkHasWalletName().catch(Logger.error)
  }, [walletType])

  const handleEnteredValidPin = useCallback(
    (pin: string) => {
      AnalyticsService.capture('OnboardingPasswordSet')

      /**
       * we are using a dummy mnemonic here
       * even though we are creating a seedless wallet.
       * this allows our pin/biometric logic to work normally
       */

      // TODO: use a random string instead of a constant
      onPinCreated(SEEDLESS_MNEMONIC_STUB, pin, false)
        .then(() => {
          if (useBiometrics) {
            BiometricsSDK.storeWalletWithBiometry(SEEDLESS_MNEMONIC_STUB)
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
