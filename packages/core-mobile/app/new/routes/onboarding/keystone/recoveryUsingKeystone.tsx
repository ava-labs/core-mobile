import React from 'react'
import { useRouter } from 'expo-router'
import { UR } from '@ngraveio/bc-ur'
import { RecoveryUsingKeystone as Component } from 'features/onboarding/components/RecoveryUsingKeystone'
import Logger from 'utils/Logger'
import KeystoneService from 'hardware/services/KeystoneService'

export default function RecoveryUsingKeystone(): JSX.Element {
  const { navigate, replace } = useRouter()

  function handleNext(ur: UR): void {
    try {
      KeystoneService.init(ur)

      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/onboarding/keystone/createPin'
      })
    } catch (error: any) {
      Logger.error(error.message)
      throw new Error('Failed to parse UR')
    }
  }

  function handleError(): void {
    replace({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/keystone/keystoneTroubleshooting'
    })
  }

  return <Component onSuccess={handleNext} onError={handleError} />
}
