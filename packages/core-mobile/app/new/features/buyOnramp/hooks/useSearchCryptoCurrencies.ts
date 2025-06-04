import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { SearchProviderCategories } from 'services/meld/consts'
import MeldService from 'services/meld/MeldService'

export type SearchCryptoCurrenciesParams = {
  categories: SearchProviderCategories[]
  serviceProviders: string[]
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
  countries,
  accountFilter
}: SearchCryptoCurrenciesParams): UseQueryResult<CryptoCurrency[], Error> => {
  return useQuery({
    queryKey: [
      'meld',
      'cryptoCurrencies',
      categories,
      serviceProviders,
      countries,
      accountFilter
    ],
    queryFn: () =>
      MeldService.searchCryptoCurrencies({
        categories,
        serviceProviders,
        countries,
        accountFilter
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
