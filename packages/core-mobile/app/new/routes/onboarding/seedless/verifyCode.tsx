import React, { useCallback } from 'react'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { VerifyCode as VerifyCodeComponent } from 'features/onboarding/components/VerifyCode'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

export default function VerifyCode(): JSX.Element {
  const { onVerifyCode } = useRecoveryMethodContext()
  const router = useDebouncedRouter()

  const onVerifySuccess = useCallback((): void => {
    router.navigate('./analyticsConsent')
    AnalyticsService.capture('SeedlessMfaVerified', {
      type: 'Authenticator'
    })
  }, [router])

  return (
    <BlurredBarsContentLayout>
      <VerifyCodeComponent
        onVerifyCode={onVerifyCode}
        onVerifySuccess={onVerifySuccess}
        sx={{ marginTop: 25 }}
      />
    </BlurredBarsContentLayout>
  )
}
