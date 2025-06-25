import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { isAndroid, isIOS } from 'utils/Utils'
import { MeldDefaultParams, SearchDefaultsByCountry } from '../types'
import MeldService from '../services/MeldService'
import { PaymentMethods } from '../consts'
import { useLocale } from './useLocale'

export type SearchDefaultsByCountryParams = MeldDefaultParams & {
  cryptoCurrencies?: string[]
}

export const useSearchDefaultsByCountry = ({
  categories,
  accountFilter = true
}: Omit<SearchDefaultsByCountryParams, 'countries'>): UseQueryResult<
  SearchDefaultsByCountry[],
  Error
> => {
  const { countryCode } = useLocale()

  return useQuery<SearchDefaultsByCountry[]>({
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
        const paymentMethods = curr.defaultPaymentMethods?.filter(
          pm =>
            (isAndroid && pm !== PaymentMethods.APPLE_PAY) ||
            (isIOS && pm !== PaymentMethods.GOOGLE_PAY)
        )
        return [...acc, { ...curr, defaultPaymentMethods: paymentMethods }]
      }, [] as SearchDefaultsByCountry[])
    },
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
