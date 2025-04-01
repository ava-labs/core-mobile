import { useLocalSearchParams, useRouter } from 'expo-router'
import { CreatePin } from 'features/onboarding/components/CreatePin'
import { useWallet } from 'hooks/useWallet'
import React, { useState } from 'react'
import Logger from 'utils/Logger'

const ChangePinScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useRouter()
  const [useBiometrics, setUseBiometrics] = useState(true)
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>()
  const { onPinCreated } = useWallet()

  const handleEnteredValidPin = (pin: string): void => {
    onPinCreated(mnemonic, pin, false)
      .then(() => canGoBack() && back())
      .catch(Logger.error)
  }

  return (
    <CreatePin
      onEnteredValidPin={handleEnteredValidPin}
      useBiometrics={useBiometrics}
      setUseBiometrics={setUseBiometrics}
      newPinTitle="Enter your new PIN"
      confirmPinTitle="Confirm your new PIN"
    />
  )
}
export default ChangePinScreen
