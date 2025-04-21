import React from 'react'
import { EnterRecoveryPhrase as Component } from 'features/onboarding/components/EnterRecoveryPhrase'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

export default function EnterRecoveryPhrase(): JSX.Element {
  const { navigate } = useDebouncedRouter()

  function handleNext(mnemonic: string): void {
    navigate({
      pathname: './createPin',
      params: { mnemonic }
    })
  }

  return <Component onNext={handleNext} />
}
