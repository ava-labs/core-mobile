import { useLocalSearchParams, useRouter } from 'expo-router'
import Component from 'features/onboarding/components/FidoNameInput'
import { useRegisterAndAuthenticateFido } from 'features/onboarding/hooks/useRegisterAndAuthenticateFido'
import React, { useCallback, useState } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { FidoType } from 'services/passkey/types'

export type FIDONameInputProps = {
  fidoType: FidoType
  title: string
  description: string
  textInputPlaceholder: string
}

const FidoNameInput = (): JSX.Element => {
  const router = useRouter()
  const { registerAndAuthenticateFido } = useRegisterAndAuthenticateFido()
  const { title, description, textInputPlaceholder, fidoType } =
    useLocalSearchParams<FIDONameInputProps>()

  const [name, setName] = useState<string>('')

  const onAccountVerified = useCallback(async (): Promise<void> => {
    router.back()

    // @ts-ignore TODO: make routes typesafe
    router.navigate('/onboarding/seedless/analyticsConsent')
    AnalyticsService.capture('SeedlessMfaVerified', {
      type: fidoType ?? 'Fido'
    })
  }, [router, fidoType])

  const handleSave = async (): Promise<void> => {
    if (router.canGoBack()) {
      router.back()
    }
    fidoType &&
      (await registerAndAuthenticateFido({
        name,
        fidoType,
        onAccountVerified,
        verifyMfaPath: ''
      }))
  }

  return (
    <Component
      title={title ?? ''}
      description={description ?? ''}
      textInputPlaceholder={textInputPlaceholder ?? ''}
      name={name}
      setName={setName}
      onSave={handleSave}
    />
  )
}

export default FidoNameInput
