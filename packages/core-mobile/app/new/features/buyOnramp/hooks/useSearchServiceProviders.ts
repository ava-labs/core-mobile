import { useQuery, UseQueryResult } from '@tanstack/react-query'
import MeldService from 'services/meld/MeldService'
import {
  ServiceProviderCategories,
  ServiceProviders
} from 'services/meld/consts'
import { SearchCryptoCurrenciesParams } from './useSearchCryptoCurrencies'
import { useLocale } from './useLocale'

export type SearchServiceProvidersResponse = {
  serviceProvider: keyof typeof ServiceProviders
  name: string
  status: string
  categories: ServiceProviderCategories[]
  categoryStatuses: Record<ServiceProviderCategories, string>
  websiteUrl: string
  customerSupportUrl: string
  logos: {
    dark: string
    light: string
    darkShort: string
    lightShort: string
  }
}

export const useSearchServiceProviders = ({
  categories,
  accountFilter = true
}: Omit<SearchCryptoCurrenciesParams, 'countries'>): UseQueryResult<
  SearchServiceProvidersResponse[],
  Error
> => {
  const { countryCode } = useLocale()

  return useQuery<SearchServiceProvidersResponse[]>({
    queryKey: [
      'meld',
      'searchServiceProviders',
      categories,
      accountFilter,
      countryCode
    ],
    queryFn: () =>
      MeldService.searchServiceProviders({
        countries: [countryCode],
        categories,
        accountFilter
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
