import { useStoredBiometrics } from 'common/hooks/useStoredBiometrics'
import { useRouter } from 'expo-router'
import { CreatePin as Component } from 'features/onboarding/components/CreatePin'
import { useWallet } from 'hooks/useWallet'
import React, { useCallback } from 'react'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WalletType } from 'services/wallet/types'
import { selectActiveWalletId } from 'store/wallet/slice'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import { uuid } from 'utils/uuid'

export default function CreatePin(): JSX.Element {
  const { navigate } = useRouter()
  const { onPinCreated } = useWallet()
  const { isBiometricAvailable, useBiometrics, setUseBiometrics } =
    useStoredBiometrics()
  const activeWalletId = useSelector(selectActiveWalletId)

  const handleEnteredValidPin = useCallback(
    (pin: string): void => {
      AnalyticsService.capture('OnboardingPasswordSet')
      onPinCreated({
        walletId: activeWalletId ?? uuid(),
        mnemonic: uuid(),
        pin,
        walletType: WalletType.KEYSTONE
      })
        .then(() => {
          if (useBiometrics) {
            BiometricsSDK.enableBiometry().catch(Logger.error)
          }
          navigate({
            // @ts-ignore TODO: make routes typesafe
            pathname: '/onboarding/keystone/setWalletName'
          })
        })
        .catch(Logger.error)
    },
    [navigate, onPinCreated, useBiometrics]
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
