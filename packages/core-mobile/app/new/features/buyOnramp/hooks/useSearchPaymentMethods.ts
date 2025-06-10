import { useQuery, UseQueryResult } from '@tanstack/react-query'
import MeldService from 'services/meld/MeldService'
import {
  PaymentMethods,
  PaymentTypes,
  ServiceProviderCategories,
  ServiceProviders
} from 'services/meld/consts'
import { useLocale } from './useLocale'
import { useSearchServiceProviders } from './useSearchServiceProviders'

export type SearchPaymentMethodsParams = {
  categories: ServiceProviderCategories[]
  countries: string[]
  serviceProviders?: (keyof typeof ServiceProviders)[]
  accountFilter?: boolean
}

export type SearchPaymentMethodsResponse = {
  paymentMethod: keyof typeof PaymentMethods
  name: string
  paymentType: PaymentTypes
  logos: {
    dark: string
    light: string
  }
}

export const useSearchPaymentMethods = ({
  categories,
  accountFilter = true
}: Omit<
  SearchPaymentMethodsParams,
  'countries' | 'serviceProviders'
>): UseQueryResult<SearchPaymentMethodsResponse[], Error> => {
  const { data: serviceProvidersData } = useSearchServiceProviders({
    categories: [ServiceProviderCategories.CryptoOnramp]
  })
  const serviceProviders = serviceProvidersData?.map(
    serviceProvider => serviceProvider.serviceProvider
  )

  const { countryCode } = useLocale()

  return useQuery<SearchPaymentMethodsResponse[]>({
    queryKey: [
      'meld',
      'searchPaymentMethods',
      categories,
      countryCode,
      serviceProviders,
      accountFilter
    ],
    queryFn: () =>
      MeldService.searchPaymentMethods({
        serviceProviders,
        countries: [countryCode],
        categories,
        accountFilter
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
