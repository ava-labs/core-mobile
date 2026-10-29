import { UseQueryResult } from '@tanstack/react-query'
import { useCallback } from 'react'
import { CurrencySymbol } from 'store/settings/currency'
import { GetTradeLimits } from '../types'
import { ServiceProviderCategories } from '../consts'
import { NpRoute } from '../services/networkPartnerSchemas'
import { routesToTradeLimits } from '../services/networkPartnerAdapters'
import { useMeldCountryCode, useMeldPaymentMethod } from '../store'
import { useMeldRoutes } from './useMeldRoutes'

export const useGetTradeLimits = ({
  category,
  fiatCurrencies,
  cryptoCurrencyCodes
}: {
  category: ServiceProviderCategories
  fiatCurrencies?: CurrencySymbol[]
  cryptoCurrencyCodes?: string[]
}): UseQueryResult<GetTradeLimits[], Error> => {
  const [countryCode] = useMeldCountryCode()
  const [paymentMethod] = useMeldPaymentMethod()
  const fiatCurrencyCode = fiatCurrencies?.[0]
  const cryptoCurrencyCode = cryptoCurrencyCodes?.[0]
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
