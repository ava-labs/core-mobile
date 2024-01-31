import { useState, useEffect } from 'react'
import { BridgeAsset } from '@avalabs/bridge-unified'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import Logger from 'utils/Logger'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { chainIdToCaip } from 'utils/data/caip'

export const useUnifiedBridgeAssets = (): {
  assets: BridgeAsset[]
} => {
  const [assets, setAssets] = useState<BridgeAsset[]>([])
  const activeNetwork = useSelector(selectActiveNetwork)

  useEffect(() => {
    UnifiedBridgeService.getAssets()
      .then(allAssets => {
        setAssets(allAssets[chainIdToCaip(activeNetwork.chainId)] ?? [])
      })
      .catch(Logger.error)
  }, [activeNetwork.chainId])

  return { assets }
}
