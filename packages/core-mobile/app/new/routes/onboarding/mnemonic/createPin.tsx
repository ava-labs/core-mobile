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
    async (pin: string): Promise<void> => {
      if (!mnemonic) {
        return
      }
      AnalyticsService.capture('OnboardingPasswordSet')
      try {
        await onPinCreated({
          walletId: activeWalletId ?? uuid(),
          mnemonic,
          pin,
          walletType: WalletType.MNEMONIC
        })
        if (useBiometrics === false) {
          navigateToSetWalletName()
          return
        }
        setTimeout(async () => {
          const enabled = await BiometricsSDK.enableBiometry()
          if (enabled === false) setUseBiometrics(false)
          navigateToSetWalletName()
        }, 100)
      } catch (error) {
        Logger.error('Failed to create pin', error)
      }
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
