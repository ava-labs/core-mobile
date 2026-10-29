import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { MeldDefaultParams, SearchDefaultsByCountry } from '../types'
import MeldService from '../services/MeldService'
import { ServiceProviderCategories } from '../consts'
import { isPaymentMethodSupported } from '../utils'
import { useMeldCountryCode } from '../store'

// This hook is only used for crypto onramp
export const useSearchDefaultsByCountry = ({
  categories
}: Omit<MeldDefaultParams, 'countries'>): UseQueryResult<
  SearchDefaultsByCountry[],
  Error
> => {
  const [countryCode] = useMeldCountryCode()

  return useQuery<SearchDefaultsByCountry[]>({
    enabled:
      !!countryCode &&
      categories.includes(ServiceProviderCategories.CRYPTO_ONRAMP),
    queryKey: [
      ReactQueryKeys.MELD_SEARCH_DEFAULTS_BY_COUNTRY,
      categories,
      countryCode
    ],
    queryFn: () =>
      MeldService.searchDefaultsByCountry({
        countries: countryCode ? [countryCode] : undefined,
        categories
      }),
    select: data =>
      data.map(curr => ({
        ...curr,
        defaultPaymentMethods: (curr.defaultPaymentMethods ?? []).filter(
          isPaymentMethodSupported
        )
      })),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
