import { useState, useEffect } from 'react'
import { BridgeAsset, ChainAssetMap } from '@avalabs/bridge-unified'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import Logger from 'utils/Logger'
import { chainIdToCaip } from 'utils/data/caip'
import { useNetworks } from 'hooks/networks/useNetworks'

export const useUnifiedBridgeAssets = (): {
  bridgeAssets: BridgeAsset[]
  chainAssetMap: ChainAssetMap | undefined
} => {
  const [bridgeAssets, setBridgeAssets] = useState<BridgeAsset[]>([])
  const [chainAssetMap, setChainAssetMap] = useState<ChainAssetMap>()
  const { activeNetwork } = useNetworks()

  useEffect(() => {
    UnifiedBridgeService.getAssets()
      .then(assetMap => {
        setChainAssetMap(assetMap)
        setBridgeAssets(assetMap[chainIdToCaip(activeNetwork.chainId)] ?? [])
      })
      .catch(Logger.error)
  }, [activeNetwork.chainId])

  return { bridgeAssets, chainAssetMap }
}
