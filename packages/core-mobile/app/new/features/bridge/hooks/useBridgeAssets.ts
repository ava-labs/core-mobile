import { useState, useEffect, useMemo } from 'react'
import { BridgeAsset, ChainAssetMap } from '@avalabs/bridge-unified'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import Logger from 'utils/Logger'
import { getCaip2ChainId } from 'utils/caip2ChainIds'

export const useBridgeAssetMap = (): ChainAssetMap => {
  const [chainAssetMap, setChainAssetMap] = useState<ChainAssetMap>({})

  useEffect(() => {
    UnifiedBridgeService.getAssets()
      .then(allAssets => {
        setChainAssetMap(allAssets)
      })
      .catch(Logger.error)
  }, [])

  return chainAssetMap
}

export const useBridgeAssets = (
  sourceNetworkChainId?: number
): BridgeAsset[] => {
  const chainAssetMap = useBridgeAssetMap()

  return useMemo(() => {
    if (!sourceNetworkChainId) return []

    const caipChainId = getCaip2ChainId(sourceNetworkChainId)

    return chainAssetMap[caipChainId] ?? []
  }, [chainAssetMap, sourceNetworkChainId])
}
