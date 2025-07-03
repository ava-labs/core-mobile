import { useStoredBiometrics } from 'common/hooks/useStoredBiometrics'
import { useRouter } from 'expo-router'
import { CreatePin } from 'features/onboarding/components/CreatePin'
import React, { useCallback } from 'react'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'

const ChangePinScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useRouter()
  const { isBiometricAvailable, useBiometrics, setUseBiometrics } =
    useStoredBiometrics()

  const handleEnteredValidPin = useCallback(
    (pin: string): void => {
      if (useBiometrics) {
        BiometricsSDK.enableBiometry()
          .then(() => {
            canGoBack() && back()
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
    [back, canGoBack, useBiometrics]
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
