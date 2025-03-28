import React, { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CreatePin as Component } from 'features/onboarding/components/CreatePin'
import { useWallet } from 'hooks/useWallet'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'

export default function CreatePin(): JSX.Element {
  const [useBiometrics, setUseBiometrics] = useState(true)
  const { navigate } = useRouter()
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>()
  const { onPinCreated } = useWallet()

  const handleEnteredValidPin = (pin: string): void => {
    if (!mnemonic) {
      return
    }

    AnalyticsService.capture('OnboardingPasswordSet')
    onPinCreated(mnemonic, pin, false)
      .then(() => {
        navigate({ pathname: './setWalletName', params: { mnemonic } })
      })
      .catch(Logger.error)
  }
  return (
    <Component
      onEnteredValidPin={handleEnteredValidPin}
      useBiometrics={useBiometrics}
      setUseBiometrics={setUseBiometrics}
      newPinTitle="Secure your wallet with a PIN"
      newPinDescription="For extra security, avoid choosing a PIN that contains repeating digits in a sequential order"
      confirmPinTitle="Confirm your PIN code"
    />
  )
}
