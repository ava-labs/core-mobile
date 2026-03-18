import { useAfterScreenTransition } from 'common/hooks/useAfterScreenTransition'
import { EnterRecoveryPhrase as Component } from 'features/onboarding/components/EnterRecoveryPhrase'
import { useRouter } from 'expo-router'
import React, { useRef } from 'react'
import { TextInput } from 'react-native'

export default function EnterRecoveryPhrase(): JSX.Element {
  const { navigate } = useRouter()
  const recoveryPhraseInputRef = useRef<TextInput>(null)

  useAfterScreenTransition(() => recoveryPhraseInputRef.current?.focus())

  function handleNext(mnemonic: string): void {
    navigate({
      pathname: '/onboarding/mnemonic/createPin',
      params: { mnemonic }
    })
  }

  return <Component ref={recoveryPhraseInputRef} onNext={handleNext} />
}
