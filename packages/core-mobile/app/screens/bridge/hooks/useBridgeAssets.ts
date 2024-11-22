import { useState, useEffect } from 'react'
import { BridgeAsset, ChainAssetMap } from '@avalabs/bridge-unified'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import Logger from 'utils/Logger'
import { useNetworks } from 'hooks/networks/useNetworks'
import { getCaip2ChainId } from 'utils/caip2ChainIds'

export const useBridgeAssets = (): {
  chainAssetMap: ChainAssetMap
  bridgeAssets: BridgeAsset[]
} => {
  const [bridgeAssets, setBridgeAssets] = useState<BridgeAsset[]>([])
  const [chainAssetMap, setChainAssetMap] = useState<ChainAssetMap>({})
  const { activeNetwork } = useNetworks()

  useEffect(() => {
    UnifiedBridgeService.getAssets()
      .then(allAssets => {
        setChainAssetMap(allAssets)
        const caipChainId = getCaip2ChainId(activeNetwork.chainId)

        setBridgeAssets(allAssets[caipChainId] ?? [])
      })
      .catch(Logger.error)
  }, [activeNetwork.chainId])

  return { bridgeAssets, chainAssetMap }
}
