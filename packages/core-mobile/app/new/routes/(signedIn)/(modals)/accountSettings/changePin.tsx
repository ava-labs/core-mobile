import { useLocalSearchParams, useRouter } from 'expo-router'
import { CreatePin } from 'features/onboarding/components/CreatePin'
import { useWallet } from 'hooks/useWallet'
import React, { useState, useEffect } from 'react'
import Logger from 'utils/Logger'
import { Keyboard, KeyboardEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { selectWalletType } from 'store/app'
import { useSelector } from 'react-redux'

const ChangePinScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useRouter()
  const [useBiometrics, setUseBiometrics] = useState(true)
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>()
  const walletType = useSelector(selectWalletType)
  const { onPinCreated } = useWallet()
  const { bottom } = useSafeAreaInsets()

  const handleEnteredValidPin = (pin: string): void => {
    onPinCreated({ mnemonic, pin, isResetting: false, walletType })
      .then(() => canGoBack() && back())
      .catch(Logger.error)
  }

  const [keyboardHeight, setKeyboardHeight] = useState(0)

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
    />
  )
}
export default ChangePinScreen
