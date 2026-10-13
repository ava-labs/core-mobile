import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { getPerpsInfoClient } from '../services/perpsClients'
import { CoinCategory } from '../utils/marketCategories'

const EMPTY: readonly CoinCategory[] = []

/**
 * HIP-3 (builder-deployed) perp asset categories from Hyperliquid's
 * `perpCategories` endpoint — e.g. `xyz:GOLD → "commodities"`. Native perps
 * (BTC, ETH, …) are never included; those sectors come from the static map in
 * {@link ../utils/marketCategories}.
 *
 * Best-effort: on failure we fall back to an empty list so the market list still
 * renders native-sector categories. Categories change only when a deployer
 * re-annotates an asset, so cache hard.
 */
export const usePerpCategories = (): readonly CoinCategory[] => {
  const { data } = useQuery({
    queryKey: [ReactQueryKeys.PERPS_CATEGORIES],
    queryFn: () => getPerpsInfoClient().getPerpCategories(),
    staleTime: 10 * 60 * 1000,
    retry: false
  })

  return data ?? EMPTY
}
