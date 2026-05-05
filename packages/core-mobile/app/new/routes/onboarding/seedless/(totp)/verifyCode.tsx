import { useRouter } from 'expo-router'
import { VerifyCode as VerifyCodeComponent } from 'features/onboarding/components/VerifyCode'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { setCoreAnalytics } from 'store/settings/securityPrivacy'
import { isLimitedMode } from 'utils/limitedMode'

export default function VerifyCode(): JSX.Element {
  const { onVerifyCode } = useRecoveryMethodContext()
  const router = useRouter()
  const dispatch = useDispatch()

  const onVerifySuccess = useCallback((): void => {
    router.dismissAll()
    router.back()

    if (isLimitedMode) {
      dispatch(setCoreAnalytics(false))
      router.navigate('/onboarding/seedless/createPin')
    } else {
      router.navigate('/onboarding/seedless/analyticsConsent')
    }
    AnalyticsService.capture('SeedlessMfaVerified', {
      type: 'Authenticator'
    })
  }, [router, dispatch])

  // TOTP setup substep — hold the dot at step 1/5 throughout the
  // authenticator flow.
  const wizardStep = isLimitedMode
    ? { currentStep: 1, totalSteps: 5 }
    : undefined

  return (
    <VerifyCodeComponent
      onVerifyCode={onVerifyCode}
      onVerifySuccess={onVerifySuccess}
      wizardStep={wizardStep}
    />
  )
}
