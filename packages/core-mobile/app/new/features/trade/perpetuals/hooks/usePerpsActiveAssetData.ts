import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useCallback } from 'react'
import { PERPS_ACCOUNT_STALE_TIME } from '../consts'
import { usePerps } from '../contexts/PerpsProvider'
import { dexOfCoin } from '../utils/coinDex'

export type UsePerpsActiveAssetDataResult = {
  /** Hyperliquid's current leverage for `coin` (set even with no open position). */
  readonly leverage: number | undefined
  /** `"cross"` | `"isolated"` for the coin, from HL. */
  readonly leverageType: 'cross' | 'isolated' | undefined
  readonly isLoading: boolean
  /** Force a re-read (e.g. right after `updateLeverage`). */
  readonly refetch: () => Promise<number | undefined>
}

/**
 * Reads Hyperliquid's per-coin `activeAssetData` — notably the account's
 * current leverage for `coin`, which HL persists per asset even when no
 * position is open. Use this as the source of truth for the displayed leverage
 * instead of a local default. Re-reads on the shared clearinghouse refresh
 * nonce (bumped after `updateLeverage`) so the value stays in sync with HL.
 */
export const usePerpsActiveAssetData = (
  coin: string
): UsePerpsActiveAssetDataResult => {
  const { manager, userAddress, clearinghouseRefreshNonce } = usePerps()

  const query = useQuery({
    enabled: manager !== null && userAddress !== undefined && coin.length > 0,
    queryKey: [
      ReactQueryKeys.PERPS_ACTIVE_ASSET_DATA,
      userAddress,
      coin,
      clearinghouseRefreshNonce
    ],
    queryFn: async () => {
      if (manager === null || userAddress === undefined) {
        throw new Error('Prerequisites missing')
      }
      // Pass the coin's dex so HIP-3 (builder-dex) markets resolve correctly.
      return manager.info.getActiveAssetData(userAddress, coin, dexOfCoin(coin))
    },
    staleTime: PERPS_ACCOUNT_STALE_TIME
  })

  const { refetch: queryRefetch } = query
  const refetch = useCallback(async (): Promise<number | undefined> => {
    const { data } = await queryRefetch()
    return data?.leverage.value
  }, [queryRefetch])

  return {
    leverage: query.data?.leverage.value,
    leverageType: query.data?.leverage.type,
    isLoading: query.isPending,
    refetch
  }
}
