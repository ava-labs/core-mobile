import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useCallback } from 'react'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSelector } from 'react-redux'
import MeldService from '../services/MeldService'
import { routesToPaymentMethods } from '../services/networkPartnerAdapters'
import { NpRoute } from '../services/networkPartnerSchemas'
import { ServiceProviderCategories } from '../consts'
import { SearchPaymentMethods } from '../types'
import { isPaymentMethodSupported } from '../utils'
import { useMeldCountryCode, useMeldToken } from '../store'
import { useMeldRoutes } from './useMeldRoutes'

const filterSupported = (
  methods: SearchPaymentMethods[]
): SearchPaymentMethods[] =>
  methods.filter(method => isPaymentMethodSupported(method.paymentMethod))

export const useSearchPaymentMethods = ({
  category
}: {
  category: ServiceProviderCategories
}): UseQueryResult<SearchPaymentMethods[], Error> => {
  const [meldToken] = useMeldToken()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const [countryCode] = useMeldCountryCode()
  const cryptoCurrencyCode = meldToken?.currencyCode ?? undefined

  const selectRoutes = useCallback(
    (routes: NpRoute[]) => filterSupported(routesToPaymentMethods(routes)),
    []
  )

  const routesQuery = useMeldRoutes(
    {
      category,
      countryCode,
      fiatCurrencyCode: selectedCurrency,
      cryptoCurrencyCode
    },
    selectRoutes
  )

  const methodsQuery = useQuery({
    enabled: !cryptoCurrencyCode && !!countryCode && !!selectedCurrency,
    queryKey: [
      ReactQueryKeys.MELD_SEARCH_PAYMENT_METHODS,
      category,
      countryCode,
      selectedCurrency
    ],
    queryFn: () =>
      MeldService.searchPaymentMethods({
        categories: [category],
        countries: countryCode ? [countryCode] : undefined,
        fiatCurrencies: [selectedCurrency]
      }),
    select: filterSupported,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })

  return cryptoCurrencyCode ? routesQuery : methodsQuery
}
