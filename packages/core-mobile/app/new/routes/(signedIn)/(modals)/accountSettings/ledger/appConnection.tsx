import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { AppConnectionOnboardingScreen } from 'new/features/ledger/screens/AppConnectionOnboardingScreen'

export default function AppConnection(): JSX.Element {
  const { navigate } = useRouter()

  const handleNavigateToComplete = useCallback(() => {
    navigate('/accountSettings/ledger/complete')
  }, [navigate])

  return (
    <AppConnectionOnboardingScreen
      onNavigateToComplete={handleNavigateToComplete}
      showConnectionToasts={true}
      showCancelOnComplete={true}
    />
  )
}
