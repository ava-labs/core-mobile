import React from 'react'
import { useAnalyticsConsent } from 'hooks/useAnalyticsConsent'
import { useRouter } from 'expo-router'
import { AnalyticsConsent as Component } from 'features/onboarding/components/AnalyticsConsent'

export default function AnalyticsConsent(): JSX.Element {
  const { navigate } = useRouter()
  const { accept, reject } = useAnalyticsConsent()

  function handleAcceptAnalytics(): void {
    accept()

    // @ts-ignore TODO: make routes typesafe
    navigate('/onboarding/seedless/createPin')
  }

  function handleRejectAnalytics(): void {
    reject()

    // @ts-ignore TODO: make routes typesafe
    navigate('/onboarding/seedless/createPin')
  }

  return (
    <Component
      onAcceptAnalytics={handleAcceptAnalytics}
      onRejectAnalytics={handleRejectAnalytics}
    />
  )
}
