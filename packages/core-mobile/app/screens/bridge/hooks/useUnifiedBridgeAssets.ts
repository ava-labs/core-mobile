import {
  BridgeAsset,
  ChainAssetMap,
  UnifiedBridgeService
} from '@avalabs/bridge-unified'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useNetworks } from 'hooks/networks/useNetworks'
import { addNamespaceToChain } from 'services/walletconnectv2/utils'

export const useUnifiedBridgeAssets = (
  unifiedBridge: UnifiedBridgeService | undefined
): UseQueryResult<
  { chainAssetMap: ChainAssetMap; bridgeAssets: BridgeAsset[] },
  Error
> => {
  const { activeNetwork } = useNetworks()

  return useQuery({
    queryKey: [unifiedBridge, activeNetwork, 'unifiedBridgeAssets'],
    queryFn: async () => {
      if (!unifiedBridge) {
        throw new Error('Fail to get assets for unified bridge')
      }

      const caipChainId = addNamespaceToChain(activeNetwork.chainId)

      const chainAssetMap = unifiedBridge.getAssets()
      const bridgeAssets = chainAssetMap?.[caipChainId] ?? []

      return { chainAssetMap, bridgeAssets }
    },
    enabled: !!unifiedBridge
  })
}
