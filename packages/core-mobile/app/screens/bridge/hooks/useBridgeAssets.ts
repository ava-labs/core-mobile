import { useState, useEffect } from 'react'
import { BridgeAsset, ChainAssetMap } from '@avalabs/bridge-unified'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import Logger from 'utils/Logger'
import { useNetworks } from 'hooks/networks/useNetworks'
import { getCaip2ChainId } from 'utils/caip2ChainIds'

export const useBridgeAssets = (
  sourceNetworkChainId?: number
): {
  chainAssetMap: ChainAssetMap
  bridgeAssets: BridgeAsset[]
} => {
  const [bridgeAssets, setBridgeAssets] = useState<BridgeAsset[]>([])
  const [chainAssetMap, setChainAssetMap] = useState<ChainAssetMap>({})
  const { activeNetwork } = useNetworks()

  const chainId = sourceNetworkChainId ?? activeNetwork.chainId

  useEffect(() => {
    UnifiedBridgeService.getAssets()
      .then(allAssets => {
        setChainAssetMap(allAssets)
        const caipChainId = getCaip2ChainId(chainId)

        setBridgeAssets(allAssets[caipChainId] ?? [])
      })
      .catch(Logger.error)
  }, [chainId])

  return { bridgeAssets, chainAssetMap }
}
