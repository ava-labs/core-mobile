import { useQuery, UseQueryResult } from '@tanstack/react-query'
import MeldService from 'services/meld/MeldService'
import { SearchCryptoCurrenciesParams } from './useSearchCryptoCurrencies'
import { useLocale } from './useLocale'

export type ServiceProviders = {
  serviceProvider: string
  name: string
  status: string
  categories: string[]
  categoryStatuses: Record<string, string>
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
  serviceProviders,
  accountFilter = true
}: Omit<SearchCryptoCurrenciesParams, 'countries'>): UseQueryResult<
  ServiceProviders[],
  Error
> => {
  const { countryCode } = useLocale()

  return useQuery<ServiceProviders[]>({
    queryKey: [
      'meld',
      'countries',
      categories,
      accountFilter,
      countryCode,
      serviceProviders
    ],
    queryFn: () =>
      MeldService.searchServiceProviders({
        serviceProviders,
        countries: [countryCode],
        categories,
        accountFilter
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
