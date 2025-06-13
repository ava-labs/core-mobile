import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import MeldService from 'features/buyOnramp/services/MeldService'
import { Country, MeldDefaultParams } from '../types'
import { useLocale } from './useLocale'
import { useSearchServiceProviders } from './useSearchServiceProviders'

export const useSearchCountries = ({
  categories,
  accountFilter = true
}: Omit<MeldDefaultParams, 'countries'>): UseQueryResult<Country[], Error> => {
  const { countryCode } = useLocale()
  const { data: serviceProvidersData } = useSearchServiceProviders({
    categories
  })
  const serviceProviders = serviceProvidersData?.map(
    serviceProvider => serviceProvider.serviceProvider
  )

  return useQuery<Country[]>({
    queryKey: [
      ReactQueryKeys.MELD_SEARCH_COUNTRIES,
      serviceProviders,
      countryCode,
      categories,
      accountFilter
    ],
    queryFn: () =>
      MeldService.searchCountries({
        serviceProviders,
        countries: [countryCode],
        categories,
        accountFilter
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
