import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { isAndroid, isIOS } from 'utils/Utils'
import { MeldDefaultParams, SearchDefaultsByCountry } from '../types'
import MeldService from '../services/MeldService'
import { PaymentMethods, ServiceProviderCategories } from '../consts'
import { useLocale } from './useLocale'

export type SearchDefaultsByCountryParams = MeldDefaultParams & {
  cryptoCurrencies?: string[]
}

// This hook is only used for crypto onramp
export const useSearchDefaultsByCountry = ({
  categories,
  accountFilter = true
}: Omit<SearchDefaultsByCountryParams, 'countries'>): UseQueryResult<
  SearchDefaultsByCountry[],
  Error
> => {
  const { countryCode } = useLocale()

  return useQuery<SearchDefaultsByCountry[]>({
    enabled: categories.includes(ServiceProviderCategories.CRYPTO_ONRAMP),
    queryKey: [
      ReactQueryKeys.MELD_SEARCH_DEFAULTS_BY_COUNTRY,
      categories,
      accountFilter,
      countryCode
    ],
    queryFn: () =>
      MeldService.searchDefaultsByCountry({
        countries: [countryCode],
        categories,
        accountFilter
      }),
    select: data => {
      return data.reduce((acc, curr) => {
        const paymentMethods = (curr.defaultPaymentMethods ?? []).filter(pm => {
          if (isAndroid) return pm !== PaymentMethods.APPLE_PAY
          if (isIOS) return pm !== PaymentMethods.GOOGLE_PAY
          return true
        })
        return [...acc, { ...curr, defaultPaymentMethods: paymentMethods }]
      }, [] as SearchDefaultsByCountry[])
    },
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
