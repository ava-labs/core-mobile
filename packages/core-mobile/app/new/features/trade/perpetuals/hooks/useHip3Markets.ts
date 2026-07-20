import { filterDelistedFromMetaAndAssetCtxs } from '@avalabs/perps-sdk'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { HIP3_MARKETS_STALE_TIME } from '../consts'
import { getPerpsInfoClient } from '../services/perpsClients'
import { PerpMarketData } from '../types'
import { namespacedCoin } from '../utils/coinDex'
import { toPerpMarket } from '../utils/toPerpMarket'

/**
 * Every builder-deployed (HIP-3) perp market, discovered by fanning out across
 * `perpDexs` and pulling each dex's `metaAndAssetCtxs`. Coin symbols are
 * namespaced (`dex:TICKER`) so they're distinct from native perps.
 *
 * Kept separate from {@link usePerpsMarkets} so the native universe (a single
 * request) isn't coupled to multi-dex fetch latency, and cached hard since
 * builder listings change rarely. Degrades gracefully: a failing dex is skipped
 * (`Promise.allSettled`) rather than failing the whole list.
 */
export const useHip3Markets = (): PerpMarketData[] => {
  const { data } = useQuery({
    queryKey: [ReactQueryKeys.PERPS_HIP3_MARKETS],
    queryFn: async (): Promise<PerpMarketData[]> => {
      const client = getPerpsInfoClient()
      const perpDexs = await client.getPerpDexs()

      // Index 0 is the native/main dex (`null`); keep only named builder dexs.
      const builderDexs = perpDexs.filter(
        (entry): entry is NonNullable<typeof entry> =>
          entry !== null && entry.name !== ''
      )

      const perDex = await Promise.allSettled(
        builderDexs.map(async ({ name: dex }) => {
          const [meta, ctxs] = filterDelistedFromMetaAndAssetCtxs(
            await client.getMetaAndAssetCtxs(dex)
          )
          return meta.universe.map((universe, i) =>
            toPerpMarket(ctxs[i], {
              symbol: namespacedCoin(dex, universe.name),
              dex
            })
          )
        })
      )

      return perDex.flatMap(result =>
        result.status === 'fulfilled' ? result.value : []
      )
    },
    staleTime: HIP3_MARKETS_STALE_TIME
  })

  return data ?? []
}
