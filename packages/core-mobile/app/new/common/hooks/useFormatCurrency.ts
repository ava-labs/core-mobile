import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { formatCurrency as _formatCurrency } from 'utils/FormatCurrency'
import { NotationTypes } from 'consts/FormatNumberTypes'

export function useFormatCurrency(): {
  formatCurrency(props: FormatCurrencyProps): string
  formatTokenInCurrency(props: FormatCurrencyProps): string
} {
  const selectedCurrency = useSelector(selectSelectedCurrency)

  /**
   * Localized currency formatter
   */
  const formatCurrency = useCallback(
    ({ amount, notation, withCurrencySuffix = false }: FormatCurrencyProps) => {
      const formattedText = _formatCurrency({
        amount,
        currency: selectedCurrency,
        boostSmallNumberPrecision: false,
        notation
      })

      if (withCurrencySuffix && !formattedText.endsWith(selectedCurrency)) {
        return [formattedText, selectedCurrency].join(' ')
      }

      return formattedText
    },
    [selectedCurrency]
  )

  /**
   * When displaying token value in currency we keep max 8 fraction digits
   */
  const formatTokenInCurrency = useCallback(
    ({ amount, notation, withCurrencySuffix = false }: FormatCurrencyProps) => {
      const formattedText = _formatCurrency({
        amount,
        currency: selectedCurrency,
        boostSmallNumberPrecision: true,
        notation
      })

      if (withCurrencySuffix && !formattedText.endsWith(selectedCurrency)) {
        return [formattedText, selectedCurrency].join(' ')
      }

      return formattedText
    },
    [selectedCurrency]
  )

  return {
    formatCurrency,
    formatTokenInCurrency
  }
}

type FormatCurrencyProps = {
  amount: number
  notation?: NotationTypes
  withCurrencySuffix?: boolean
}
