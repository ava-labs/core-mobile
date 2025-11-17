import { useCallback, useMemo } from 'react'
import { isDefined } from 'common/utils/isDefined'
import { useExchangeRates } from 'common/hooks/useExchangeRates'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSelector } from 'react-redux'
import { GetTradeLimits } from '../types'

const DEFAULT_MINIMUM_AMOUNT_IN_USD = 15
const DEFAULT_MAXIMUM_AMOUNT_IN_USD = 20000
const DEFAULT_MINIMUM_AMOUNT_IN_ETH = 0.01
const DEFAULT_MINIMUM_AMOUNT_IN_BTC = 0.001
const DEFAULT_MAXIMUM_AMOUNT_IN_USDC = 2000

/**
 * Hook to get the minimum and maximum withdraw amount limits for a given symbol
 * @returns The minimum and maximum withdraw amount limits for a given symbol
 */
export const useWithdrawAmountLimit = (): {
  getWithdrawAmountMinLimit: (
    tradeLimits?: GetTradeLimits,
    currentTokenPrice?: number | null
  ) => number | undefined
  getWithdrawAmountMaxLimit: (
    tradeLimits?: GetTradeLimits,
    currentTokenPrice?: number | null
  ) => number | undefined
} => {
  const { data: exchangeRates } = useExchangeRates()
  const currencyCode = useSelector(selectSelectedCurrency)

  const defaultMinimumAmountInCurrency = useMemo(() => {
    const exchangeRate = exchangeRates?.usd?.[currencyCode.toLowerCase()]
    if (exchangeRate) {
      return DEFAULT_MINIMUM_AMOUNT_IN_USD * exchangeRate
    }
  }, [exchangeRates, currencyCode])

  const defaultMaximumAmountInCurrency = useMemo(() => {
    const exchangeRate = exchangeRates?.usd?.[currencyCode.toLowerCase()]
    if (exchangeRate) {
      return DEFAULT_MAXIMUM_AMOUNT_IN_USD * exchangeRate
    }
  }, [exchangeRates, currencyCode])

  const getWithdrawAmountMinLimit = useCallback(
    (tradeLimits?: GetTradeLimits, currentTokenPrice?: number | null) => {
      if (
        !isDefined(tradeLimits?.minimumAmount) ||
        !isDefined(currentTokenPrice) ||
        tradeLimits?.currencyCode?.toLowerCase() === 'usdc'
      ) {
        return defaultMinimumAmountInCurrency
      }
      if (tradeLimits?.currencyCode?.toLowerCase() === 'eth') {
        return DEFAULT_MINIMUM_AMOUNT_IN_ETH * currentTokenPrice
      }
      if (tradeLimits?.currencyCode?.toLowerCase() === 'btc') {
        return DEFAULT_MINIMUM_AMOUNT_IN_BTC * currentTokenPrice
      }
      return currentTokenPrice * tradeLimits.minimumAmount
    },
    [defaultMinimumAmountInCurrency]
  )

  const getWithdrawAmountMaxLimit = useCallback(
    (tradeLimits?: GetTradeLimits, currentTokenPrice?: number | null) => {
      if (
        !isDefined(tradeLimits?.maximumAmount) ||
        !isDefined(currentTokenPrice) ||
        tradeLimits?.currencyCode?.toLowerCase() === 'btc' ||
        tradeLimits?.currencyCode?.toLowerCase() === 'eth'
      ) {
        return defaultMaximumAmountInCurrency
      }
      if (tradeLimits?.currencyCode?.toLowerCase() === 'usdc') {
        return DEFAULT_MAXIMUM_AMOUNT_IN_USDC * currentTokenPrice
      }
      return currentTokenPrice * tradeLimits.maximumAmount
    },
    [defaultMaximumAmountInCurrency]
  )

  return {
    getWithdrawAmountMinLimit,
    getWithdrawAmountMaxLimit
  }
}
