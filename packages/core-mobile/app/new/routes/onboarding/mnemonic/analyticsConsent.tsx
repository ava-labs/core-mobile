import React from 'react'
import { useAnalyticsConsent } from 'hooks/useAnalyticsConsent'
import { useGlobalSearchParams } from 'expo-router'
import { AnalyticsConsent as Component } from 'features/onboarding/components/AnalyticsConsent'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

export default function AnalyticsConsent(): JSX.Element {
  const { navigate } = useDebouncedRouter()
  const { accept, reject } = useAnalyticsConsent()
  const { recovering } = useGlobalSearchParams<{ recovering: string }>()

  const nextPathname =
    recovering === 'true' ? './enterRecoveryPhrase' : './recoveryPhrase'

  function handleAcceptAnalytics(): void {
    accept()
    navigate(nextPathname)
  }

  function handleRejectAnalytics(): void {
    reject()
    navigate(nextPathname)
  }

  return (
    <Component
      onAcceptAnalytics={handleAcceptAnalytics}
      onRejectAnalytics={handleRejectAnalytics}
    />
  )
}
