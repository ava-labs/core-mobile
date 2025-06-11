import { useQuery, UseQueryResult } from '@tanstack/react-query'
import MeldService from 'services/meld/MeldService'
import {
  ServiceProviderCategories,
  ServiceProviders
} from 'services/meld/consts'
import { useLocale } from './useLocale'
import { useSearchServiceProviders } from './useSearchServiceProviders'

export type SearchCountriesParams = {
  accountFilter?: boolean
  categories: ServiceProviderCategories[]
  serviceProviders?: (keyof typeof ServiceProviders)[]
  countries: string[]
}

export type Country = {
  countryCode: string
  name: string
  flagImageUrl: string
  regions: string[] | null
}

export const useSearchCountries = ({
  categories,
  accountFilter
}: SearchCountriesParams): UseQueryResult<Country[], Error> => {
  const { data: serviceProvidersData } = useSearchServiceProviders({
    categories: [ServiceProviderCategories.CryptoOnramp]
  })
  const serviceProviders = serviceProvidersData?.map(
    serviceProvider => serviceProvider.serviceProvider
  )
  const { countryCode } = useLocale()

  return useQuery<Country[]>({
    queryKey: [
      'meld',
      'searchCountries',
      countryCode,
      categories,
      accountFilter,
      serviceProviders
    ],
    queryFn: () =>
      MeldService.searchCountries({
        categories,
        serviceProviders,
        countries: [countryCode],
        accountFilter
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
