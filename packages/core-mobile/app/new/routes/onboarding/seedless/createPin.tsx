import React, { useCallback, useState } from 'react'
import { useRouter } from 'expo-router'
import { CreatePin as Component } from 'features/onboarding/components/CreatePin'
import { useOnboardingContext } from 'features/onboarding/contexts/OnboardingProvider'

export default function CreatePin(): JSX.Element {
  const { hasWalletName } = useOnboardingContext()
  const [useBiometrics, setUseBiometrics] = useState(true)
  const { navigate } = useRouter()

  const handleEnteredValidPin = useCallback(() => {
    if (hasWalletName) {
      navigate('./selectAvatar')
    } else {
      navigate('./setWalletName')
    }
  }, [hasWalletName, navigate])

  return (
    <Component
      onEnteredValidPin={handleEnteredValidPin}
      useBiometrics={useBiometrics}
      setUseBiometrics={setUseBiometrics}
    />
  )
}
