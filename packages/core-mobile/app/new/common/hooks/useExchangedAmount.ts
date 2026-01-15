import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { formatCurrency as rawFormatCurrency } from 'utils/FormatCurrency'
import { useCallback } from 'react'
import { NotationTypes } from 'consts/FormatNumberTypes'
import { useExchangeRates } from './useExchangeRates'
import { useFormatCurrency } from './useFormatCurrency'

type FormatType = 'currency' | 'token'

export const useExchangedAmount = (): ((
  amount: number,
  notation?: NotationTypes,
  formatType?: FormatType,
  showLessThanThreshold?: boolean
) => string) => {
  const { formatCurrency, formatTokenInCurrency } = useFormatCurrency()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { data } = useExchangeRates()
  const exchangeRate = data?.usd?.[selectedCurrency.toLowerCase()]

  return useCallback(
    (
      amount: number,
      notation?: NotationTypes,
      formatType: FormatType = 'currency',
      showLessThanThreshold = false
      // eslint-disable-next-line max-params
    ) => {
      const boostSmallNumberPrecision = formatType === 'token'
      const formatter =
        formatType === 'token' ? formatTokenInCurrency : formatCurrency

      // if the exchange rate is not available, we show the value in USD
      return exchangeRate
        ? formatter({
            amount: amount * exchangeRate,
            notation,
            showLessThanThreshold
          })
        : rawFormatCurrency({
            amount,
            currency: 'USD',
            boostSmallNumberPrecision,
            notation
          })
    },
    [formatCurrency, formatTokenInCurrency, exchangeRate]
  )
}
