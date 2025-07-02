import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSelector } from 'react-redux'
import { isAndroid, isIOS } from 'utils/Utils'
import {
  PaymentMethods,
  ServiceProviderCategories,
  ServiceProviders
} from '../consts'
import MeldService from '../services/MeldService'
import { SearchPaymentMethods } from '../types'
import { useMeldToken } from '../store'
import { useLocale } from './useLocale'

export type SearchPaymentMethodsParams = {
  categories: ServiceProviderCategories[]
  countries: string[]
  serviceProviders?: ServiceProviders[]
  accountFilter?: boolean
  fiatCurrencies?: string[]
  cryptoCurrencyCodes?: string[]
}

export const useSearchPaymentMethods = ({
  categories,
  accountFilter = true,
  serviceProviders
}: Omit<SearchPaymentMethodsParams, 'countries'>): UseQueryResult<
  SearchPaymentMethods[],
  Error
> => {
  const [meldToken] = useMeldToken()
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const { countryCode } = useLocale()
  const cryptoCurrencyCode = meldToken?.currencyCode

  return useQuery<SearchPaymentMethods[]>({
    enabled: serviceProviders !== undefined,
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
    select: data => {
      return data.filter(pm => {
        if (isAndroid) return pm.paymentMethod !== PaymentMethods.APPLE_PAY
        if (isIOS) return pm.paymentMethod !== PaymentMethods.GOOGLE_PAY
        return true
      })
    },
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
