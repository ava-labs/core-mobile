import { useLocalSearchParams } from 'expo-router'
import { CollectibleScreen } from 'features/portfolio/collectibles/components/CollectibleScreen'
import React from 'react'

export const VISIBLE_ITEM_WIDTH = 0.7
export const CAROUSEL_ITEM_GAP = 0
export const GRADIENT_HEIGHT = 60

const CollectibleDetailScreen = (): React.JSX.Element => {
  const { localId } = useLocalSearchParams<{
    localId: string
  }>()
  return <CollectibleScreen localId={localId} />
}

export default CollectibleDetailScreen
