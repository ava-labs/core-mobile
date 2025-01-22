import React, { useCallback, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { FidoType } from 'services/passkey/types'
import { useRegisterAndAuthenticateFido } from 'features/onboarding/hooks/useRegisterAndAuthenticateFido'
import Component from 'features/onboarding/components/FidoNameInput'
import AnalyticsService from 'services/analytics/AnalyticsService'

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
    router.navigate('./analyticsConsent')
    AnalyticsService.capture('SeedlessMfaVerified', {
      type: fidoType ?? 'Fido'
    })
  }, [router, fidoType])

  const handleSave = (): void => {
    if (router.canGoBack()) {
      router.back()
    }
    fidoType &&
      registerAndAuthenticateFido({
        name,
        fidoType,
        onAccountVerified
      })
  }

  return (
    <Component
      title={title ?? ''}
      description={description ?? ''}
      textInputPlaceholder={textInputPlaceholder ?? ''}
      name={name}
      setName={setName}
      handleSave={handleSave}
    />
  )
}

export default FidoNameInput
