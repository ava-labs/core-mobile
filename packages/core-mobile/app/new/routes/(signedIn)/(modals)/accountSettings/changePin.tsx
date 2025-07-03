import { useStoredBiometrics } from 'common/hooks/useStoredBiometrics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CreatePin } from 'features/onboarding/components/CreatePin'
import { useWallet } from 'hooks/useWallet'
import React, { useCallback } from 'react'
import { WalletType } from 'services/wallet/types'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'

const ChangePinScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useRouter()
  const { onPinCreated } = useWallet()
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>()
  const { isBiometricAvailable, useBiometrics, setUseBiometrics } =
    useStoredBiometrics()

  const handleEnteredValidPin = useCallback(
    (pin: string): void => {
      if (useBiometrics && mnemonic) {
        onPinCreated({ mnemonic, pin, walletType: WalletType.MNEMONIC })
          .then(() => {
            BiometricsSDK.enableBiometry()
              .then(() => {
                canGoBack() && back()
              })
              .catch(Logger.error)
          })
          .catch(Logger.error)
        return
      }
      BiometricsSDK.changePin(pin)
        .then(() => {
          canGoBack() && back()
        })
        .catch(Logger.error)
    },
    [back, canGoBack, useBiometrics, onPinCreated, mnemonic]
  )

  return (
    <CreatePin
      onEnteredValidPin={handleEnteredValidPin}
      useBiometrics={useBiometrics}
      setUseBiometrics={setUseBiometrics}
      newPinTitle={`Enter your\nnew PIN`}
      confirmPinTitle={`Confirm your\nnew PIN`}
      isBiometricAvailable={isBiometricAvailable}
      isModal
    />
  )
}
export default ChangePinScreen
