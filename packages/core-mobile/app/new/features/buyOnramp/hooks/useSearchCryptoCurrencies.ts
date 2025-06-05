import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { SearchProviderCategories } from 'services/meld/consts'
import MeldService from 'services/meld/MeldService'
import { useLocale } from './useLocale'

export type SearchCryptoCurrenciesParams = {
  categories: SearchProviderCategories[]
  serviceProviders?: string[]
  countries: string[]
  accountFilter?: boolean
}

export type CryptoCurrency = {
  currencyCode: string
  name: string
  chainCode: string
  chainName: string
  chainId: string
  contractAddress: string
  symbolImageUrl: string
}

export const useSearchCryptoCurrencies = ({
  categories,
  serviceProviders,
  accountFilter = true
}: Omit<SearchCryptoCurrenciesParams, 'countries'>): UseQueryResult<
  CryptoCurrency[],
  Error
> => {
  const { countryCode } = useLocale()
  return useQuery({
    queryKey: [
      'meld',
      'cryptoCurrencies',
      categories,
      serviceProviders,
      countryCode,
      accountFilter
    ],
    queryFn: () =>
      MeldService.searchCryptoCurrencies({
        categories,
        serviceProviders,
        countries: [countryCode],
        accountFilter
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
