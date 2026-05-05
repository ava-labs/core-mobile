import { useLocalSearchParams, useRouter } from 'expo-router'
import Component from 'features/onboarding/components/FidoNameInput'
import { useRegisterAndAuthenticateFido } from 'features/onboarding/hooks/useRegisterAndAuthenticateFido'
import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { FidoType } from 'services/passkey/types'
import { setCoreAnalytics } from 'store/settings/securityPrivacy'
import { isLimitedMode } from 'utils/limitedMode'

export type FIDONameInputProps = {
  fidoType: FidoType
  title: string
  description: string
  textInputPlaceholder: string
}

const FidoNameInput = (): JSX.Element => {
  const router = useRouter()
  const dispatch = useDispatch()
  const { registerAndAuthenticateFido } = useRegisterAndAuthenticateFido()
  const { title, description, textInputPlaceholder, fidoType } =
    useLocalSearchParams<FIDONameInputProps>()

  const [name, setName] = useState<string>('')

  const onAccountVerified = useCallback(async (): Promise<void> => {
    router.back()

    if (isLimitedMode) {
      dispatch(setCoreAnalytics(false))
      router.navigate('/onboarding/seedless/createPin')
    } else {
      router.navigate('/onboarding/seedless/analyticsConsent')
    }
    AnalyticsService.capture('SeedlessMfaVerified', {
      type: fidoType ?? 'Fido'
    })
  }, [router, fidoType, dispatch])

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

  // FIDO setup is a substep of the MFA "Add recovery method" step, so we
  // hold the dot at step 1/5 throughout — moves to step 2 only after the
  // user lands on createPin.
  const wizardStep = isLimitedMode
    ? { currentStep: 1, totalSteps: 5 }
    : undefined

  return (
    <Component
      title={title ?? ''}
      description={description ?? ''}
      textInputPlaceholder={textInputPlaceholder ?? ''}
      name={name}
      setName={setName}
      onSave={handleSave}
      wizardStep={wizardStep}
    />
  )
}

export default FidoNameInput
