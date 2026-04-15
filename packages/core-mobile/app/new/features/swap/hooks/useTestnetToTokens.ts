import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import type {
  Asset,
  BridgeableUiAsset,
  Caip2ChainId
} from '@avalabs/fusion-sdk'
import { TokenType as FusionTokenType } from '@avalabs/fusion-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { selectActiveAccount } from 'store/account'
import type { LocalTokenWithBalance } from 'store/balance'
import { getChainIdFromCaip2, getCaip2ChainId } from 'utils/caip2ChainIds'
import { useTokensWithBalanceByNetworkForAccount } from 'features/portfolio/hooks/useTokensWithBalanceByNetworkForAccount'
import FusionService from '../services/FusionService'
import { mapSdkAssetToLocal } from '../utils/mapSdkAssetToLocal'
import { toSwappableAsset } from '../utils/fusionTypeConverters'
import {
  useIsFusionServiceReady,
  useSwapSelectedFromToken
} from './useZustandStore'

const STALE_TIME = 2 * 60 * 1000 // 2 minutes

const toFusionSourceAsset = (
  token: LocalTokenWithBalance
): Asset | undefined => {
  try {
    return toSwappableAsset(token)
  } catch {
    return undefined
  }
}

/**
 * Fetches the bridgeable "to" token list for testnet mode.
 *
 * Uses the Fusion SDK's getBridgeableAssets to ensure only SDK-supported tokens are shown.
 * In testnet, the set of supported tokens is small and fixed (Avalanche EVM bridge, wrap/unwrap,
 * and Lombard) so the SDK can own the list without pagination.
 * In mainnet, MARKR supports 6000+ tokens per network and the SDK does not support
 * pagination, so we manage the list ourselves via the separate paginated useSwapTokens hook.
 */
export const useTestnetToTokens = (
  targetCaip2Id: string
): {
  tokens: LocalTokenWithBalance[]
  isLoading: boolean
} => {
  const [isFusionServiceReady] = useIsFusionServiceReady()
  const [selectedFromToken] = useSwapSelectedFromToken()
  const activeAccount = useSelector(selectActiveAccount)

  const chainId = useMemo(
    () => (targetCaip2Id ? getChainIdFromCaip2(targetCaip2Id) : undefined),
    [targetCaip2Id]
  )

  const { tokens: portfolioTokens } = useTokensWithBalanceByNetworkForAccount(
    activeAccount,
    chainId
  )

  const sourceAsset = useMemo(
    () =>
      selectedFromToken ? toFusionSourceAsset(selectedFromToken) : undefined,
    [selectedFromToken]
  )

  const sourceChainId = useMemo(
    () =>
      selectedFromToken
        ? (getCaip2ChainId(selectedFromToken.networkChainId) as Caip2ChainId)
        : undefined,
    [selectedFromToken]
  )

  const balanceMap = useMemo(() => {
    const map = new Map<string, LocalTokenWithBalance>()
    portfolioTokens?.forEach(token => {
      if (token.localId) {
        map.set(token.localId.toLowerCase(), token)
      }
    })
    return map
  }, [portfolioTokens])

  const { data: rawAssets, isLoading } = useQuery({
    queryKey: [
      ReactQueryKeys.FUSION_BRIDGEABLE_ASSETS,
      sourceChainId,
      targetCaip2Id,
      sourceAsset
    ],
    queryFn: async () => {
      // enabled guard ensures these are defined before queryFn runs
      const asset = sourceAsset as Asset
      const srcChainId = sourceChainId as Caip2ChainId
      return FusionService.getBridgeableAssets({
        sourceAsset: asset,
        sourceChainId: srcChainId,
        targetChainId: targetCaip2Id as Caip2ChainId
      })
    },
    enabled:
      isFusionServiceReady &&
      !!sourceAsset &&
      !!sourceChainId &&
      !!targetCaip2Id,
    staleTime: STALE_TIME
  })

  const tokens = useMemo((): LocalTokenWithBalance[] => {
    if (!rawAssets) return []

    return (rawAssets as readonly BridgeableUiAsset[]).map(asset => {
      const localId =
        asset.type !== FusionTokenType.NATIVE
          ? asset.address.toLowerCase()
          : `NATIVE-${asset.symbol}`
      const balanceData = balanceMap.get(localId.toLowerCase())
      return mapSdkAssetToLocal(asset, chainId ?? 0, balanceData)
    })
  }, [rawAssets, balanceMap, chainId])

  return { tokens, isLoading }
}
