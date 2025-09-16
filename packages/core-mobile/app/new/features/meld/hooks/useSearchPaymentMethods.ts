import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSelector } from 'react-redux'
import { isAndroid, isIOS } from 'utils/Utils'
import { selectIsEnableMeldSandboxBlocked } from 'store/posthog/slice'
import { PaymentMethods } from '../consts'
import MeldService from '../services/MeldService'
import { MeldDefaultParams, SearchPaymentMethods } from '../types'
import { useMeldCountryCode, useMeldToken } from '../store'

export type SearchPaymentMethodsParams = MeldDefaultParams & {
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
  const isSandboxBlocked = useSelector(selectIsEnableMeldSandboxBlocked)
  const [meldToken] = useMeldToken()
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const [countryCode] = useMeldCountryCode()
  const cryptoCurrencyCode = meldToken?.currencyCode

  return useQuery<SearchPaymentMethods[]>({
    queryKey: [
      ReactQueryKeys.MELD_SEARCH_PAYMENT_METHODS,
      categories,
      countryCode,
      serviceProviders,
      accountFilter,
      selectedCurrency,
      cryptoCurrencyCode,
      isSandboxBlocked
    ],
    queryFn: () =>
      MeldService.searchPaymentMethods({
        sandbox: !isSandboxBlocked,
        fiatCurrencies: [selectedCurrency],
        cryptoCurrencyCodes: cryptoCurrencyCode
          ? [cryptoCurrencyCode]
          : undefined,
        serviceProviders,
        countries: countryCode ? [countryCode] : undefined,
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
