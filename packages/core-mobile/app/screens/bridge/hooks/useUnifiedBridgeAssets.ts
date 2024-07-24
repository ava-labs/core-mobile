import { useState, useEffect } from 'react'
import { BridgeAsset } from '@avalabs/bridge-unified'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import Logger from 'utils/Logger'
import { chainIdToCaip } from 'utils/data/caip'
import { useNetworks } from 'hooks/networks/useNetworks'

export const useUnifiedBridgeAssets = (): {
  assets: BridgeAsset[]
} => {
  const [assets, setAssets] = useState<BridgeAsset[]>([])
  const { activeNetwork } = useNetworks()

  useEffect(() => {
    UnifiedBridgeService.getAssets()
      .then(allAssets => {
        setAssets(allAssets[chainIdToCaip(activeNetwork.chainId)] ?? [])
      })
      .catch(Logger.error)
  }, [activeNetwork.chainId])

  return { assets }
}
