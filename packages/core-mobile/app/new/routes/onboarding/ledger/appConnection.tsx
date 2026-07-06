import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { AppConnectionOnboardingScreen } from 'new/features/ledger/screens/AppConnectionOnboardingScreen'

export default function AppConnection(): JSX.Element {
  const { navigate } = useRouter()

  const handleNavigateToComplete = useCallback(() => {
    navigate('/onboarding/ledger/setWalletName')
  }, [navigate])

  return (
    <AppConnectionOnboardingScreen
      onNavigateToComplete={handleNavigateToComplete}
      showConnectionToasts={false}
      showCancelOnComplete={false}
    />
  )
}
