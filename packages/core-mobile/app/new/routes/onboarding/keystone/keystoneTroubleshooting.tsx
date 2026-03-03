import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { KeystoneTroubleshooting as Component } from 'features/onboarding/components/KeystoneTroubleshooting'

export default function KeystoneTroubleshooting(): JSX.Element {
  const { replace } = useRouter()

  const retry = useCallback(() => {
    replace({
      pathname: '/onboarding/keystone/recoveryUsingKeystone'
    })
  }, [replace])

  return <Component retry={retry} />
}
