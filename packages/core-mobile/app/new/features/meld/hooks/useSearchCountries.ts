import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import MeldService from 'features/meld/services/MeldService'
import { Country, MeldDefaultParams } from '../types'
import { useSearchServiceProviders } from './useSearchServiceProviders'

export const useSearchCountries = ({
  countries,
  categories,
  accountFilter = true
}: MeldDefaultParams): UseQueryResult<Country[], Error> => {
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
      countries,
      categories,
      accountFilter
    ],
    queryFn: () =>
      MeldService.searchCountries({
        serviceProviders,
        countries,
        categories,
        accountFilter
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
