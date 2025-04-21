import React from 'react'
import { useGlobalSearchParams } from 'expo-router'
import { VerifyRecoveryPhrase as Component } from 'features/onboarding/components/VerifyRecoveryPhrase'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

export default function VerifyRecoveryPhrase(): JSX.Element {
  const { navigate } = useDebouncedRouter()
  const { mnemonic } = useGlobalSearchParams<{ mnemonic: string }>()

  const handleVerified = (): void => {
    navigate({ pathname: './createPin', params: { mnemonic } })
  }

  return <Component onVerified={handleVerified} mnemonic={mnemonic} />
}
