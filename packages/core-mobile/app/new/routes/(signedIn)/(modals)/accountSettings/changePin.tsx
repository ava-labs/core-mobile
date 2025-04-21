import { useLocalSearchParams } from 'expo-router'
import { CreatePin } from 'features/onboarding/components/CreatePin'
import { useWallet } from 'hooks/useWallet'
import React, { useState, useEffect, useCallback } from 'react'
import Logger from 'utils/Logger'
import { Keyboard, KeyboardEvent, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import BiometricsSDK from 'utils/BiometricsSDK'
import { StorageKey } from 'resources/Constants'
import { commonStorage } from 'utils/mmkv'
import { useStoredBiometrics } from 'common/hooks/useStoredBiometrics'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

const ChangePinScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useDebouncedRouter()
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>()
  const { onPinCreated } = useWallet()
  const { bottom } = useSafeAreaInsets()
  const [keyboardHeight, setKeyboardHeight] = useState(0)
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

  // Configure keyboard listeners
  useEffect(() => {
    if (Platform.OS !== 'ios') return
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
