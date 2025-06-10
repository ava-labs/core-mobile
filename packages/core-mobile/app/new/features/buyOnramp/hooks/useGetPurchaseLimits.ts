import { useQuery, UseQueryResult } from '@tanstack/react-query'
import {
  ServiceProviderCategories,
  ServiceProviders
} from 'services/meld/consts'
import MeldService from 'services/meld/MeldService'
import { CurrencySymbol } from 'store/settings/currency'
import { useLocale } from './useLocale'
import { useSearchServiceProviders } from './useSearchServiceProviders'

export type GetPurchaseLimitsParams = {
  categories: ServiceProviderCategories[]
  serviceProviders?: (keyof typeof ServiceProviders)[]
  accountFilter?: boolean
  fiatCurrencies?: CurrencySymbol[]
  includeDetails?: boolean
  cryptoCurrencyCodes?: string[]
}

type AmountDetails = {
  defaultAmount?: number
  minimumAmount: number
  maximumAmount: number
}

export type GetPurchaseLimitsResponse = {
  currencyCode: string
  chainCode?: string
  defaultAmount?: number
  minimumAmount: number
  maximumAmount: number
  meldDetails?: AmountDetails
  serviceProviderDetails?: Record<keyof typeof ServiceProviders, AmountDetails>
}

export const useGetPurchaseLimits = ({
  categories,
  fiatCurrencies,
  includeDetails,
  cryptoCurrencyCodes
}: Omit<
  GetPurchaseLimitsParams,
  'serviceProviders' | 'accountFilter'
>): UseQueryResult<GetPurchaseLimitsResponse[], Error> => {
  const { data: serviceProvidersData } = useSearchServiceProviders({
    categories: [ServiceProviderCategories.CryptoOnramp]
  })
  const serviceProviders = serviceProvidersData?.map(
    serviceProvider => serviceProvider.serviceProvider
  )
  const { countryCode } = useLocale()
  return useQuery({
    enabled: !!serviceProviders,
    queryKey: [
      'meld',
      'getPurchaseLimits',
      categories,
      countryCode,
      fiatCurrencies,
      includeDetails,
      cryptoCurrencyCodes,
      serviceProviders
    ],
    queryFn: () =>
      MeldService.getPurchaseLimits({
        categories,
        countries: [countryCode],
        serviceProviders,
        fiatCurrencies,
        includeDetails,
        cryptoCurrencyCodes
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
