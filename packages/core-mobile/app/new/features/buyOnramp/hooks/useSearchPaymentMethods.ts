import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSelector } from 'react-redux'
import { ServiceProviderCategories, ServiceProviders } from '../consts'
import MeldService from '../services/MeldService'
import { SearchPaymentMethods } from '../types'
import { useOnRampToken } from '../store'
import { useLocale } from './useLocale'
import { useSearchServiceProviders } from './useSearchServiceProviders'

export type SearchPaymentMethodsParams = {
  categories: ServiceProviderCategories[]
  countries: string[]
  serviceProviders?: (keyof typeof ServiceProviders)[]
  accountFilter?: boolean
  fiatCurrencies?: string[]
  cryptoCurrencyCodes?: string[]
}

export const useSearchPaymentMethods = ({
  categories,
  accountFilter = true
}: Omit<
  SearchPaymentMethodsParams,
  'countries' | 'serviceProviders'
>): UseQueryResult<SearchPaymentMethods[], Error> => {
  const [onrampToken] = useOnRampToken()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { data: serviceProvidersData } = useSearchServiceProviders({
    categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
  })
  const serviceProviders = serviceProvidersData?.map(
    serviceProvider => serviceProvider.serviceProvider
  )

  const { countryCode } = useLocale()
  const cryptoCurrencyCode = onrampToken?.currencyCode

  return useQuery<SearchPaymentMethods[]>({
    queryKey: [
      ReactQueryKeys.MELD_SEARCH_PAYMENT_METHODS,
      categories,
      countryCode,
      serviceProviders,
      accountFilter,
      selectedCurrency,
      cryptoCurrencyCode
    ],
    queryFn: () =>
      MeldService.searchPaymentMethods({
        fiatCurrencies: [selectedCurrency],
        cryptoCurrencyCodes: cryptoCurrencyCode
          ? [cryptoCurrencyCode]
          : undefined,
        serviceProviders,
        countries: [countryCode],
        categories,
        accountFilter
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
