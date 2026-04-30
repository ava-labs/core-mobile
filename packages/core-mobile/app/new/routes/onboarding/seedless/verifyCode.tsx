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

  return (
    <VerifyCodeComponent
      showNavigationHeaderTitle={false}
      onVerifyCode={onVerifyCode}
      onVerifySuccess={onVerifySuccess}
    />
  )
}
