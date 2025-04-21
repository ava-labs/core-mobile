import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SendOnboarding } from 'features/send/components/SendOnboarding'

export const OnboardingScreen = (): JSX.Element => {
  const { replace } = useRouter()

  const handleGoToRecentContacts = useCallback((): void => {
    replace('/collectiblesSend/recentContacts')
  }, [replace])

  return <SendOnboarding onNext={handleGoToRecentContacts} />
}
