import { useStoredBiometrics } from 'common/hooks/useStoredBiometrics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CreatePin } from 'features/onboarding/components/CreatePin'
import { useWallet } from 'hooks/useWallet'
import React, { useCallback } from 'react'
import { StorageKey } from 'resources/Constants'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import { commonStorage } from 'utils/mmkv'

const ChangePinScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useRouter()
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>()
  const { onPinCreated } = useWallet()
  const { isBiometricAvailable, useBiometrics, setUseBiometrics } =
    useStoredBiometrics()

  const handleEnteredValidPin = useCallback(
    (pin: string): void => {
      onPinCreated(mnemonic, pin, false)
        .then(() => {
          if (useBiometrics) {
            BiometricsSDK.storeWalletWithBiometry(mnemonic)
              .then(() => canGoBack() && back())
              .catch(Logger.error)
          } else {
            commonStorage.set(StorageKey.SECURE_ACCESS_SET, 'PIN')
            canGoBack() && back()
          }
        })
        .catch(Logger.error)
    },
    [mnemonic, onPinCreated, back, canGoBack, useBiometrics]
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
