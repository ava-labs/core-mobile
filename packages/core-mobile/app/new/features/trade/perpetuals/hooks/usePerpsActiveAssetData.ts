import { maxOpenSizeCoin, type ActiveAssetData } from '@avalabs/perps-sdk'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useCallback } from 'react'
import Logger from 'utils/Logger'
import { PERPS_ACCOUNT_STALE_TIME } from '../consts'
import { usePerps } from '../contexts/PerpsProvider'
import { dexOfCoin } from '../utils/coinDex'

export type UsePerpsActiveAssetDataResult = {
  /** Hyperliquid's current leverage for `coin` (set even with no open position). */
  readonly leverage: number | undefined
  /** `"cross"` | `"isolated"` for the coin, from HL. */
  readonly leverageType: 'cross' | 'isolated' | undefined
  /** HL's authoritative maximum buy size, in coin units. */
  readonly maxBuySizeCoin: number | undefined
  /** HL's authoritative maximum sell size, in coin units. */
  readonly maxSellSizeCoin: number | undefined
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
    // `manager` is intentionally excluded from the key: it is a non-serializable
    // singleton gated by `enabled`, and the key must stay stable across manager
    // re-inits. `userAddress`/`coin`/refresh-nonce already scope the data.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.PERPS_ACTIVE_ASSET_DATA,
      userAddress,
      coin,
      clearinghouseRefreshNonce
    ],
    queryFn: async (): Promise<ActiveAssetData> => {
      if (manager === null || userAddress === undefined) {
        throw new Error('Prerequisites missing')
      }
      // Pass the coin's dex so HIP-3 (builder-dex) markets resolve correctly.
      const dex = dexOfCoin(coin)
      const activeAssetData = await manager.info.getActiveAssetData(
        userAddress,
        coin,
        dex
      )
      Logger.info('[perps] activeAssetData', {
        coin,
        dex,
        activeAssetData
      })
      return activeAssetData
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
    maxBuySizeCoin: maxOpenSizeCoin(query.data, true),
    maxSellSizeCoin: maxOpenSizeCoin(query.data, false),
    isLoading:
      query.isPending || (query.isFetching && query.data === undefined),
    refetch
  }
}
