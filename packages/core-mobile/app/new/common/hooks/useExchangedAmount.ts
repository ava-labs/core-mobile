import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { formatCurrency as rawFormatCurrency } from 'utils/FormatCurrency'
import { useCallback } from 'react'
import { NotationTypes } from 'consts/FormatNumberTypes'
import { useExchangeRates } from './useExchangeRates'
import { useFormatCurrency } from './useFormatCurrency'

export const useExchangedAmount = (): ((
  amount: number,
  notation?: NotationTypes
) => string) => {
  const { formatCurrency } = useFormatCurrency()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { data } = useExchangeRates()
  const exchangeRate = data?.usd?.[selectedCurrency.toLowerCase()]

  return useCallback(
    (amount: number, notation?: NotationTypes) => {
      // if the exchange rate is not available, we show the value in USD
      return exchangeRate
        ? formatCurrency(amount * exchangeRate, notation)
        : rawFormatCurrency({
            amount,
            currency: 'USD',
            boostSmallNumberPrecision: false,
            notation
          })
    },
    [formatCurrency, exchangeRate]
  )
}
