import React from 'react'
import { useRouter } from 'expo-router'
import { UR } from '@ngraveio/bc-ur'
import { RecoveryUsingKeystone as Component } from 'features/onboarding/components/RecoveryUsingKeystone'
import Logger from 'utils/Logger'
import KeystoneService from 'features/keystone/services/KeystoneService'

export default function RecoveryUsingKeystone(): JSX.Element {
  const { navigate, replace } = useRouter()

  function handleNext(ur: UR): void {
    try {
      KeystoneService.init(ur)

      navigate({
        pathname: '/onboarding/keystone/createPin'
      })
    } catch (error: unknown) {
      Logger.error(error instanceof Error ? error.message : 'Unknown error')
      throw new Error('Failed to parse UR')
    }
  }

  function handleError(): void {
    replace({
      pathname: '/onboarding/keystone/keystoneTroubleshooting'
    })
  }

  return <Component onSuccess={handleNext} onError={handleError} />
}
