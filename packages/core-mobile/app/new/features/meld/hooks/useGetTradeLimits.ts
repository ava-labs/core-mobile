import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { CurrencySymbol } from 'store/settings/currency'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { GetTradeLimits, MeldDefaultParams } from '../types'
import MeldService from '../services/MeldService'
import { ServiceProviderCategories } from '../consts'
import { useMeldCountryCode } from '../store'
import { useSearchServiceProviders } from './useSearchServiceProviders'

export type GetTradeLimitsParams = MeldDefaultParams & {
  fiatCurrencies?: CurrencySymbol[]
  includeDetails?: boolean
  cryptoCurrencyCodes?: string[]
}

export const useGetTradeLimits = ({
  category,
  fiatCurrencies,
  includeDetails,
  cryptoCurrencyCodes
}: Omit<
  GetTradeLimitsParams,
  'categories' | 'serviceProviders' | 'countries'
> & {
  category: ServiceProviderCategories
}): UseQueryResult<GetTradeLimits[], Error> => {
  const { data: serviceProvidersData } = useSearchServiceProviders({
    categories: [category]
  })
  const serviceProviders = serviceProvidersData?.map(
    serviceProvider => serviceProvider.serviceProvider
  )

  const meldQueryKey =
    category === ServiceProviderCategories.CRYPTO_ONRAMP
      ? ReactQueryKeys.MELD_GET_PURCHASE_LIMITS
      : ReactQueryKeys.MELD_GET_SELL_LIMITS

  const [countryCode] = useMeldCountryCode()

  return useQuery({
    enabled: !!serviceProviders,
    queryKey: [
      meldQueryKey,
      category,
      countryCode,
      fiatCurrencies,
      includeDetails,
      cryptoCurrencyCodes,
      serviceProviders
    ],
    queryFn: () => {
      const params = {
        serviceProviders,
        categories: [category],
        countries: countryCode ? [countryCode] : undefined,
        fiatCurrencies,
        includeDetails,
        cryptoCurrencyCodes
      }
      if (category === ServiceProviderCategories.CRYPTO_ONRAMP) {
        return MeldService.getPurchaseLimits(params)
      } else {
        return MeldService.getSellLimits(params)
      }
    },
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
