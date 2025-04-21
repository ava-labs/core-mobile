import React, { useCallback, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { FidoType } from 'services/passkey/types'
import { useRegisterAndAuthenticateFido } from 'features/onboarding/hooks/useRegisterAndAuthenticateFido'
import Component from 'features/onboarding/components/FidoNameInput'
import AnalyticsService from 'services/analytics/AnalyticsService'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

export type FIDONameInputProps = {
  fidoType: FidoType
  title: string
  description: string
  textInputPlaceholder: string
}

const FidoNameInput = (): JSX.Element => {
  const router = useDebouncedRouter()
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
        onAccountVerified,
        verifyMfaPath: ''
      })
  }

  return (
    <BlurredBarsContentLayout>
      <Component
        title={title ?? ''}
        description={description ?? ''}
        textInputPlaceholder={textInputPlaceholder ?? ''}
        name={name}
        setName={setName}
        handleSave={handleSave}
      />
    </BlurredBarsContentLayout>
  )
}

export default FidoNameInput
