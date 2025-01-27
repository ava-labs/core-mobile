import React from 'react'
import { useRouter } from 'expo-router'
import { EnterRecoveryPhrase as Component } from 'features/onboarding/components/EnterRecoveryPhrase'

export default function EnterRecoveryPhrase(): JSX.Element {
  const { navigate } = useRouter()

  function handleNext(mnemonic: string): void {
    navigate({
      pathname: './createPin',
      params: { mnemonic }
    })
  }

  return <Component onNext={handleNext} />
}
