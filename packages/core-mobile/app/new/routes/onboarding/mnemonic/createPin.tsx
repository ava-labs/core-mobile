import { useStoredBiometrics } from 'common/hooks/useStoredBiometrics'
import { useLocalSearchParams, useRouter } from 'expo-router'
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
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>()
  const { onPinCreated } = useWallet()
  const { isBiometricAvailable, useBiometrics, setUseBiometrics } =
    useStoredBiometrics()
  const activeWalletId = useSelector(selectActiveWalletId)

  const navigateToSetWalletName = useCallback(() => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/mnemonic/setWalletName'
    })
  }, [navigate])

  const handleEnteredValidPin = useCallback(
    (pin: string): void => {
      if (!mnemonic) {
        return
      }
      AnalyticsService.capture('OnboardingPasswordSet')
      onPinCreated({
        walletId: activeWalletId ?? uuid(),
        mnemonic,
        pin,
        walletType: WalletType.MNEMONIC
      })
        .then(() => {
          if (useBiometrics) {
            BiometricsSDK.enableBiometry()
              .then(enabled => {
                if (enabled) {
                  navigateToSetWalletName()
                } else {
                  // If biometrics fails to enable, disable it and continue with PIN only
                  setUseBiometrics(false)
                  navigateToSetWalletName()
                }
              })
              .catch(error => {
                Logger.error(error)
                // On error, disable biometrics and continue with PIN only
                setUseBiometrics(false)
                navigateToSetWalletName()
              })
          } else {
            navigateToSetWalletName()
          }
        })
        .catch(Logger.error)
    },
    [
      mnemonic,
      onPinCreated,
      useBiometrics,
      setUseBiometrics,
      navigateToSetWalletName,
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
