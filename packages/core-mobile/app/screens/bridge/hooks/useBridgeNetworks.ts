import { useNetworksFromCaip2ChainIds } from 'temp/caip2ChainIds'
import { Network } from '@avalabs/core-chains-sdk'
import { BridgeAsset, UnifiedBridgeService } from '@avalabs/bridge-unified'
import { useUnifiedBridgeAssets } from './useUnifiedBridgeAssets'

export const useBridgeSourceNetworks = (
  unifiedBridge: UnifiedBridgeService | undefined
): Network[] => {
  const { data } = useUnifiedBridgeAssets(unifiedBridge)

  return useNetworksFromCaip2ChainIds(Object.keys(data?.chainAssetMap ?? []))
}

export const useBridgeTargetNetworks = (
  selectedBridgeAsset: BridgeAsset | undefined
): Network[] => {
  return useNetworksFromCaip2ChainIds(
    Object.keys(selectedBridgeAsset?.destinations ?? [])
  )
}
