import { useState, useEffect } from 'react'
import { BridgeAsset, ChainAssetMap } from '@avalabs/bridge-unified'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import Logger from 'utils/Logger'
import { useNetworks } from 'hooks/networks/useNetworks'
import { addNamespaceToChain } from 'services/walletconnectv2/utils'

export const useUnifiedBridgeAssets = (): {
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
        const caipChainId = addNamespaceToChain(activeNetwork.chainId)

        setBridgeAssets(allAssets[caipChainId] ?? [])
      })
      .catch(Logger.error)
  }, [activeNetwork.chainId])

  return { bridgeAssets, chainAssetMap }
}
