import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import {
  formatCurrency as _formatCurrency,
  formatIntegerCurrency as _formatIntegerCurrency
} from 'utils/FormatCurrency'
import { NotationTypes } from 'consts/FormatNumberTypes'

export function useFormatCurrency(): {
  formatCurrency(props: FormatCurrencyProps): string
  formatTokenInCurrency(props: FormatCurrencyProps): string
  formatIntegerCurrency(props: FormatCurrencyProps): string
} {
  const selectedCurrency = useSelector(selectSelectedCurrency)

  /**
   * Localized currency formatter
   */
  const formatCurrency = useCallback(
    ({
      amount,
      notation,
      withoutCurrencySuffix = false
    }: FormatCurrencyProps) => {
      const formattedText = _formatCurrency({
        amount,
        currency: selectedCurrency,
        boostSmallNumberPrecision: false,
        notation
      })

      if (withoutCurrencySuffix && formattedText.endsWith(selectedCurrency)) {
        return formattedText.replace(selectedCurrency, '').trim()
      }

      return formattedText
    },
    [selectedCurrency]
  )

  /**
   * Localized currency formatter for integer values
   */
  const formatIntegerCurrency = useCallback(
    ({ amount, withoutCurrencySuffix = false }: FormatCurrencyProps) => {
      const formattedText = _formatIntegerCurrency({
        amount,
        currency: selectedCurrency
      })

      if (withoutCurrencySuffix && formattedText.endsWith(selectedCurrency)) {
        return formattedText.replace(selectedCurrency, '').trim()
      }

      return formattedText
    },
    [selectedCurrency]
  )

  /**
   * When displaying token value in currency we keep max 8 fraction digits
   */
  const formatTokenInCurrency = useCallback(
    ({
      amount,
      notation,
      withoutCurrencySuffix = false
    }: FormatCurrencyProps) => {
      const formattedText = _formatCurrency({
        amount,
        currency: selectedCurrency,
        boostSmallNumberPrecision: true,
        notation
      })

      if (withoutCurrencySuffix && formattedText.endsWith(selectedCurrency)) {
        return formattedText.replace(selectedCurrency, '').trim()
      }

      return formattedText
    },
    [selectedCurrency]
  )

  return {
    formatCurrency,
    formatTokenInCurrency,
    formatIntegerCurrency
  }
}

type FormatCurrencyProps = {
  amount: number
  notation?: NotationTypes
  withoutCurrencySuffix?: boolean
}
