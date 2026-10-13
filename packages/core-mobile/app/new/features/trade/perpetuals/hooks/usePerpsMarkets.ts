import { filterDelistedFromMetaAndAssetCtxs } from '@avalabs/perps-sdk'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useCallback, useMemo, useState } from 'react'
import { MARKETS_REFETCH_INTERVAL, MARKETS_STALE_TIME } from '../consts'
import { getPerpsInfoClient } from '../services/perpsClients'
import { PerpMarketData } from '../types'
import { toPerpMarket } from '../utils/toPerpMarket'
import { useHip3Markets } from './useHip3Markets'

type UsePerpsMarketsResult = {
  markets: PerpMarketData[]
  isLoading: boolean
  isRefreshing: boolean
  error: Error | null
  refetch: () => void
}

/**
 * The full tradeable perpetuals universe with live asset contexts (mark price,
 * 24h change/volume, funding, OI), flattened into UI view models. Delisted
 * markets are dropped. Backed by REST `metaAndAssetCtxs`; live per-market
 * updates arrive via {@link useHyperliquidMarketContext} on the detail screen.
 *
 * Includes HIP-3 (builder-deployed) markets discovered by {@link useHip3Markets}
 * and merged in with namespaced symbols (`dex:TICKER`).
 */
export const usePerpsMarkets = (): UsePerpsMarketsResult => {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: [ReactQueryKeys.PERPS_MARKETS],
    queryFn: () => getPerpsInfoClient().getMetaAndAssetCtxs(),
    staleTime: MARKETS_STALE_TIME,
    refetchInterval: MARKETS_REFETCH_INTERVAL
  })

  const hip3Markets = useHip3Markets()

  // Only surface a refresh spinner for user-initiated reloads (pull-to-refresh),
  // never for the silent background refetch interval — otherwise a spinner would
  // flash over the populated list without any gesture.
  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefetch = useCallback(() => {
    setIsRefreshing(true)
    return refetch().finally(() => setIsRefreshing(false))
  }, [refetch])

  const markets = useMemo<PerpMarketData[]>(() => {
    if (data === undefined) {
      return hip3Markets
    }
    const [meta, ctxs] = filterDelistedFromMetaAndAssetCtxs(data)
    const nativeMarkets = meta.universe.map((entry, index) =>
      toPerpMarket(ctxs[index], { symbol: entry.name, dex: '' })
    )
    return [...nativeMarkets, ...hip3Markets]
  }, [data, hip3Markets])

  return {
    markets,
    isLoading: isPending,
    isRefreshing,
    error,
    refetch: handleRefetch
  }
}
