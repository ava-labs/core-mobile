import React from 'react'
import { useAnalyticsConsent } from 'hooks/useAnalyticsConsent'
import { AnalyticsConsent as Component } from 'features/onboarding/components/AnalyticsConsent'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

export default function AnalyticsConsent(): JSX.Element {
  const { navigate } = useDebouncedRouter()
  const { accept, reject } = useAnalyticsConsent()

  function handleAcceptAnalytics(): void {
    accept()
    navigate('./createPin')
  }

  function handleRejectAnalytics(): void {
    reject()
    navigate('./createPin')
  }

  return (
    <Component
      onAcceptAnalytics={handleAcceptAnalytics}
      onRejectAnalytics={handleRejectAnalytics}
    />
  )
}
