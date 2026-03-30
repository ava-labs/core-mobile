import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import DeviceConnectionScreen from 'new/features/ledger/screens/DeviceConnectionScreen'

export default function DeviceConnection(): JSX.Element {
  const { navigate } = useRouter()

  const handleNavigateToAppConnection = useCallback(() => {
    navigate('/onboarding/ledger/appConnection')
  }, [navigate])

  return (
    <DeviceConnectionScreen
      onNavigateToAppConnection={handleNavigateToAppConnection}
    />
  )
}
