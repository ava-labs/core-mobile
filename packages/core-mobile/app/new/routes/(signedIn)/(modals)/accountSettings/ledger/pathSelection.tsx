import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import PathSelectionScreen from 'new/features/ledger/screens/PathSelectionScreen'

export default function PathSelection(): JSX.Element {
  const { navigate } = useRouter()

  const handleNavigateToDeviceConnection = useCallback(() => {
    navigate('/accountSettings/ledger/deviceConnection')
  }, [navigate])

  return (
    <PathSelectionScreen
      onNavigateToDeviceConnection={handleNavigateToDeviceConnection}
    />
  )
}
