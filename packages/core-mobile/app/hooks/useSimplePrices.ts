import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import TokenService from 'services/token/TokenService'
import { Prices } from 'features/bridge/hooks/useBridge'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'

const REFETCH_INTERVAL = 10000 // 10 seconds

export const useSimplePrices = (
  coingeckoIds: string[],
  currency: VsCurrencyType
): UseQueryResult<Prices | undefined, Error> => {
  return useQuery({
    enabled: coingeckoIds.length > 0,
    refetchInterval: REFETCH_INTERVAL,
    queryKey: [ReactQueryKeys.SIMPLE_PRICES, coingeckoIds, currency],
    queryFn: async () =>
      TokenService.getSimplePrice({
        coinIds: coingeckoIds,
        currency: currency.toLowerCase() as VsCurrencyType,
        includeMarketData: false
      }),
    select: data => {
      if (data === undefined) {
        return undefined
      }
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value[currency]?.price ?? undefined
        ])
      )
    }
  })
}
