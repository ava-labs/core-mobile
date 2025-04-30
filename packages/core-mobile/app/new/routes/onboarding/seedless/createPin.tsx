import { useStoredBiometrics } from 'common/hooks/useStoredBiometrics'
import { useRouter } from 'expo-router'
import { CreatePin as Component } from 'features/onboarding/components/CreatePin'
import { useWallet } from 'hooks/useWallet'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { WalletType } from 'services/wallet/types'
import SeedlessService from 'seedless/services/SeedlessService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectWalletType } from 'store/app'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import { uuid } from 'utils/uuid'

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

      const dummyMnemonic = uuid()

      onPinCreated({
        mnemonic: dummyMnemonic,
        pin,
        isResetting: false,
        walletType
      })
        .then(walletId => {
          if (useBiometrics) {
            BiometricsSDK.storeWalletWithBiometry(
              walletId,
              dummyMnemonic
            ).catch(Logger.error)
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
    [hasWalletName, navigate, onPinCreated, useBiometrics, walletType]
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
