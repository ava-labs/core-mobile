import { useNetworksFromCaip2ChainIds } from 'temp/caip2ChainIds'
import { Network } from '@avalabs/core-chains-sdk'
import { BridgeAsset } from '@avalabs/bridge-unified'
import { useUnifiedBridgeAssets } from './useUnifiedBridgeAssets'

export const useBridgeSourceNetworks = (): Network[] => {
  const data = useUnifiedBridgeAssets()

  return useNetworksFromCaip2ChainIds(Object.keys(data?.chainAssetMap ?? []))
}

export const useBridgeTargetNetworks = (
  selectedBridgeAsset: BridgeAsset | undefined
): Network[] => {
  return useNetworksFromCaip2ChainIds(
    Object.keys(selectedBridgeAsset?.destinations ?? [])
  )
}
