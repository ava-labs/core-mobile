import { useQuery, UseQueryResult } from '@tanstack/react-query'
import MeldService from 'services/meld/MeldService'

export type FiatCurrency = {
  currencyCode: string
  name: string
  symbolImageUrl: string
}

export const useSearchFiatCurrencies = (): UseQueryResult<
  FiatCurrency[],
  Error
> => {
  return useQuery({
    queryKey: ['meld', 'fiatCurrencies'],
    queryFn: () => MeldService.searchFiatCurrencies(),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
