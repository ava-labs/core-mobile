import { useLocalSearchParams } from 'expo-router'
import { CollectibleScreen } from 'features/portfolio/collectibles/components/CollectibleScreen'
import React from 'react'

const CollectibleDetailScreen = (): React.JSX.Element => {
  const { localId, initial } = useLocalSearchParams<{
    localId: string
    initial: string
  }>()

  return (
    <CollectibleScreen
      localId={localId}
      initial={initial ? JSON.parse(initial) : null}
    />
  )
}

export default CollectibleDetailScreen
