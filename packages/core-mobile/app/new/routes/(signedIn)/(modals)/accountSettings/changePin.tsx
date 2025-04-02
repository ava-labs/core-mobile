import { useLocalSearchParams, useRouter } from 'expo-router'
import { CreatePin } from 'features/onboarding/components/CreatePin'
import { useWallet } from 'hooks/useWallet'
import React, { useState, useEffect, useCallback } from 'react'
import Logger from 'utils/Logger'
import { Keyboard, KeyboardEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import BiometricsSDK from 'utils/BiometricsSDK'
import { StorageKey } from 'resources/Constants'
import { commonStorage } from 'utils/mmkv'

const ChangePinScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useRouter()
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>()
  const { onPinCreated } = useWallet()
  const { bottom } = useSafeAreaInsets()
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isBiometricAvailable, setIsBiometricAvailable] =
    useState<boolean>(false)
  const [useBiometrics, setUseBiometrics] = useState(false)

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

  useEffect(() => {
    BiometricsSDK.canUseBiometry()
      .then((biometricAvailable: boolean) => {
        setIsBiometricAvailable(biometricAvailable)
      })
      .catch(Logger.error)

    const type = commonStorage.getString(StorageKey.SECURE_ACCESS_SET)
    if (type) {
      setUseBiometrics(type === 'BIO')
    } else {
      Logger.error('Secure access type not found')
    }
  }, [])

  // Configure keyboard listeners
  useEffect(() => {
    const keyboardDidShow = (e: KeyboardEvent): void => {
      setKeyboardHeight(e.endCoordinates.height - bottom)
    }
    const keyboardDidHide = (): void => {
      setKeyboardHeight(0)
    }

    const showSub = Keyboard.addListener('keyboardDidShow', keyboardDidShow)
    const hideSub = Keyboard.addListener('keyboardDidHide', keyboardDidHide)

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [bottom])

  return (
    <CreatePin
      onEnteredValidPin={handleEnteredValidPin}
      useBiometrics={useBiometrics}
      setUseBiometrics={setUseBiometrics}
      newPinTitle={`Enter your\nnew PIN`}
      confirmPinTitle={`Confirm your\nnew PIN`}
      keyboardHeight={keyboardHeight}
      isBiometricAvailable={isBiometricAvailable}
    />
  )
}
export default ChangePinScreen
