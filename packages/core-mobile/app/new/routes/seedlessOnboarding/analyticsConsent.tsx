import React from 'react'
import { useAnalyticsConsent } from 'hooks/useAnalyticsConsent'
import { useRouter } from 'expo-router'
import { AnalyticsConsent as Component } from 'new/components/onboarding/AnalyticsConsent'

export default function AnalyticsConsent(): JSX.Element {
  const { navigate } = useRouter()
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
