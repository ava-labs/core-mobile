import { useLocalSearchParams } from 'expo-router'
import { CollectibleDetailsScreen } from 'features/portfolio/collectibles/components/CollectibleDetailsScreen'
import React from 'react'

export default (): React.ReactNode => {
  const { localId, initial } = useLocalSearchParams<{
    localId: string
    initial: string
  }>()

  return (
    <CollectibleDetailsScreen
      localId={localId}
      initial={initial ? JSON.parse(initial) : null}
    />
  )
}
