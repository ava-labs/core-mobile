import { EnterRecoveryPhrase as Component } from 'features/onboarding/components/EnterRecoveryPhrase'
import { useRouter } from 'expo-router'
import React from 'react'

export default function EnterRecoveryPhrase(): JSX.Element {
  const { navigate } = useRouter()

  function handleNext(mnemonic: string): void {
    navigate({
      pathname: '/onboarding/mnemonic/createPin',
      params: { mnemonic }
    })
  }

  return <Component onNext={handleNext} />
}
