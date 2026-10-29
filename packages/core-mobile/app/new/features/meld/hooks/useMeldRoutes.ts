import { skipToken, useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { ServiceProviderCategories } from '../consts'
import MeldService from '../services/MeldService'
import { NpRoute } from '../services/networkPartnerSchemas'

export const useMeldRoutes = <T = NpRoute[]>(
  {
    category,
    countryCode,
    fiatCurrencyCode,
    cryptoCurrencyCode
  }: {
    category?: ServiceProviderCategories
    countryCode?: string
    fiatCurrencyCode?: string
    cryptoCurrencyCode?: string
  },
  select?: (routes: NpRoute[]) => T
): UseQueryResult<T, Error> => {
  const params =
    category && countryCode && fiatCurrencyCode && cryptoCurrencyCode
      ? {
          categories: [category],
          countries: [countryCode],
          fiatCurrencies: [fiatCurrencyCode],
          cryptoCurrencyCodes: [cryptoCurrencyCode]
        }
      : undefined

  return useQuery<NpRoute[], Error, T>({
    queryKey: [ReactQueryKeys.MELD_SEARCH_ROUTES, params],
    queryFn: params ? () => MeldService.searchRoutes(params) : skipToken,
    select,
    retry: 1,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}
