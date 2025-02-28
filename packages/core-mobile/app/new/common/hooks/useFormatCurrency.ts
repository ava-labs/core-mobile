import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { formatCurrency as _formatCurrency } from 'utils/FormatCurrency'
import { NotationTypes } from 'consts/FormatNumberTypes'

export function useFormatCurrency(): {
  formatCurrency(num: number, notation?: NotationTypes): string
  formatTokenInCurrency(num: number): string
} {
  const selectedCurrency = useSelector(selectSelectedCurrency)

  /**
   * Localized currency formatter
   */
  const formatCurrency = useCallback(
    (amount: number, notation?: NotationTypes) => {
      return _formatCurrency({
        amount,
        currency: selectedCurrency,
        boostSmallNumberPrecision: false,
        notation
      })
    },
    [selectedCurrency]
  )

  /**
   * When displaying token value in currency we keep max 8 fraction digits
   */
  const formatTokenInCurrency = useCallback(
    (amount: number, notation?: NotationTypes) =>
      _formatCurrency({
        amount,
        currency: selectedCurrency,
        boostSmallNumberPrecision: true,
        notation
      }),
    [selectedCurrency]
  )

  return {
    formatCurrency,
    formatTokenInCurrency
  }
}
