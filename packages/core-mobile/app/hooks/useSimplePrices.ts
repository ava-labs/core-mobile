import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import TokenService from 'services/token/TokenService'
import { Prices } from 'features/bridge/hooks/useBridge'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'

export const useSimplePrices = (
  coinIds: string[],
  currency: VsCurrencyType
): UseQueryResult<Prices | undefined, Error> => {
  return useQuery({
    enabled: coinIds.length > 0,
    queryKey: [ReactQueryKeys.SIMPLE_PRICES, coinIds, currency],
    queryFn: async () =>
      TokenService.getSimplePrice({
        coinIds,
        currency: currency.toLowerCase() as VsCurrencyType
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
