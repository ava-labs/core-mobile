import React, { useCallback, useState } from 'react'
import { useRouter } from 'expo-router'
import { CreatePin as Component } from 'new/components/onboarding/CreatePin'
import { useOnboardingContext } from 'new/contexts/OnboardingProvider'

export default function CreatePin(): JSX.Element {
  const { hasWalletName } = useOnboardingContext()
  const [useBiometrics, setUseBiometrics] = useState(true)
  const { navigate } = useRouter()

  const handleEnteredValidPin = useCallback(() => {
    if (hasWalletName) {
      navigate('./selectAvatar')
    }
    navigate('./setWalletName')
  }, [hasWalletName, navigate])

  return (
    <Component
      onEnteredValidPin={handleEnteredValidPin}
      useBiometrics={useBiometrics}
      setUseBiometrics={setUseBiometrics}
    />
  )
}
