import { UseQueryResult } from '@tanstack/react-query'
import { useCallback } from 'react'
import { GetTradeLimits } from '../types'
import { ServiceProviderCategories } from '../consts'
import { NpRoute } from '../services/networkPartnerSchemas'
import { routesToTradeLimits } from '../services/networkPartnerAdapters'
import { useMeldCountryCode, useMeldPaymentMethod } from '../store'
import { useMeldRoutes } from './useMeldRoutes'

export const useGetTradeLimits = ({
  category,
  fiatCurrencyCode,
  cryptoCurrencyCode
}: {
  category: ServiceProviderCategories
  fiatCurrencyCode?: string
  cryptoCurrencyCode?: string
}): UseQueryResult<GetTradeLimits[], Error> => {
  const [countryCode] = useMeldCountryCode()
  const [paymentMethod] = useMeldPaymentMethod()
  const select = useCallback(
    (routes: NpRoute[]): GetTradeLimits[] =>
      fiatCurrencyCode
        ? routesToTradeLimits(routes, {
            currencyCode: fiatCurrencyCode,
            paymentMethod
          })
        : [],
    [fiatCurrencyCode, paymentMethod]
  )

  return useMeldRoutes(
    { category, countryCode, fiatCurrencyCode, cryptoCurrencyCode },
    select
  )
}
