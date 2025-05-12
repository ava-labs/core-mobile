import { BridgeAsset, BridgeType } from '@avalabs/bridge-unified'
import { useMemo } from 'react'
import { getCaip2ChainId } from 'utils/caip2ChainIds'

export const useBridgeType = (
  bridgeAsset: BridgeAsset | undefined,
  targetChainId: number | undefined
): BridgeType | undefined => {
  return useMemo(() => {
    if (!bridgeAsset || !targetChainId) {
      return undefined
    }

    return bridgeAsset.destinations[getCaip2ChainId(targetChainId)]?.[0]
  }, [bridgeAsset, targetChainId])
}
