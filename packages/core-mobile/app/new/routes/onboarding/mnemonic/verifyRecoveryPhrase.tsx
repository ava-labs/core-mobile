import React from 'react'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { VerifyRecoveryPhrase as Component } from 'features/onboarding/components/VerifyRecoveryPhrase'

export default function VerifyRecoveryPhrase(): JSX.Element {
  const { navigate } = useRouter()
  const { mnemonic } = useGlobalSearchParams<{ mnemonic: string }>()

  const handleVerified = (): void => {
    navigate({ pathname: './createPin', params: { mnemonic } })
  }

  return <Component onVerified={handleVerified} mnemonic={mnemonic} />
}
