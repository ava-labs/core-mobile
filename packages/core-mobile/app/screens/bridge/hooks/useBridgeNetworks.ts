import { Network } from '@avalabs/core-chains-sdk'
import { BridgeAsset } from '@avalabs/bridge-unified'
import { useNetworks } from 'hooks/networks/useNetworks'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { useBridgeAssets } from './useBridgeAssets'

export const useBridgeSourceNetworks = (): Network[] => {
  const data = useBridgeAssets()

  return useNetworksFromCaip2ChainIds(Object.keys(data?.chainAssetMap ?? []))
}

export const useBridgeTargetNetworks = (
  selectedBridgeAsset: BridgeAsset | undefined
): Network[] => {
  return useNetworksFromCaip2ChainIds(
    Object.keys(selectedBridgeAsset?.destinations ?? [])
  )
}

export const useNetworksFromCaip2ChainIds = (
  caip2ChainIds: string[]
): Network[] => {
  const { networks } = useNetworks()

  return caip2ChainIds
    .map(caip2ChainId => getChainIdFromCaip2(caip2ChainId))
    .filter((chainId): chainId is number => !!chainId)
    .map(chainId => networks[chainId])
    .filter((network): network is Network => !!network)
}
