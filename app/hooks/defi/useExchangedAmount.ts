import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { formatCurrency } from 'utils/FormatCurrency'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useCallback } from 'react'
import { NotationTypes } from 'consts/FormatNumberTypes'
import { useExchangeRates } from './useExchangeRates'

export const useExchangedAmount = () => {
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { data } = useExchangeRates()
  const exchangeRate = data?.usd?.[selectedCurrency.toLowerCase()]

  return useCallback(
    (amount: number, notation?: NotationTypes) => {
      // if the exchange rate is not available, we show the value in USD
      return exchangeRate
        ? currencyFormatter(amount * exchangeRate, notation)
        : formatCurrency({
            amount,
            currency: 'USD',
            boostSmallNumberPrecision: false,
            notation
          })
    },
    [currencyFormatter, exchangeRate]
  )
}
