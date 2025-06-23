import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { CurrencySymbol } from 'store/settings/currency'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { ServiceProviderCategories } from '../consts'
import { GetPurchaseLimits, MeldDefaultParams } from '../types'
import MeldService from '../services/MeldService'
import { useLocale } from './useLocale'
import { useSearchServiceProviders } from './useSearchServiceProviders'

export type GetPurchaseLimitsParams = MeldDefaultParams & {
  fiatCurrencies?: CurrencySymbol[]
  includeDetails?: boolean
  cryptoCurrencyCodes?: string[]
}

export const useGetPurchaseLimits = ({
  categories,
  fiatCurrencies,
  includeDetails,
  cryptoCurrencyCodes
}: Omit<
  GetPurchaseLimitsParams,
  'serviceProviders' | 'countries'
>): UseQueryResult<GetPurchaseLimits[], Error> => {
  const { data: serviceProvidersData } = useSearchServiceProviders({
    categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
  })
  const serviceProviders = serviceProvidersData?.map(
    serviceProvider => serviceProvider.serviceProvider
  )
  const { countryCode } = useLocale()
  return useQuery({
    enabled: !!serviceProviders,
    queryKey: [
      ReactQueryKeys.MELD_GET_PURCHASE_LIMITS,
      categories,
      countryCode,
      fiatCurrencies,
      includeDetails,
      cryptoCurrencyCodes,
      serviceProviders
    ],
    queryFn: () =>
      MeldService.getPurchaseLimits({
        serviceProviders,
        categories,
        countries: [countryCode],
        fiatCurrencies,
        includeDetails,
        cryptoCurrencyCodes
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
