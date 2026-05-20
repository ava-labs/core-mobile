import { PriceChangeStatus } from '@avalabs/k2-alpine'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { isEffectivelyZero } from 'features/track/utils/utils'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { formatCurrency } from 'utils/FormatCurrency'

type Input = {
  currentPrice: number | undefined
  priceChange24h: number | undefined
  priceChangePercentage24h: number | undefined
}

type Output = {
  /** Formatted current price. Falls back to `UNKNOWN_AMOUNT` ("–"). */
  formattedPrice: string
  /** Formatted absolute 24h change. `undefined` when the value is missing or
   * effectively zero — callers should render their own placeholder. */
  formattedPriceChange: string | undefined
  /** Formatted percent change. `undefined` when missing. */
  formattedPercent: string | undefined
  status: PriceChangeStatus
}

/**
 * Shared formatting for a token's current price + 24h change indicator.
 * Mirrors the pattern used by `MarketListItem` so screens stay consistent:
 *
 * - Price → `formatCurrency({ boostSmallNumberPrecision: true })`, falling
 *   back to `UNKNOWN_AMOUNT`.
 * - Absolute change → same formatter, returning `undefined` when effectively
 *   zero (avoids a "0.00" flash).
 * - Percent → `Math.abs(value).toFixed(2) + '%'`, `undefined` when missing.
 * - Status → sign of the absolute change.
 */
export const useTokenPriceDisplay = ({
  currentPrice,
  priceChange24h,
  priceChangePercentage24h
}: Input): Output => {
  const currency = useSelector(selectSelectedCurrency)

  const formattedPrice = useMemo(
    () =>
      currentPrice
        ? formatCurrency({
            amount: currentPrice,
            currency,
            boostSmallNumberPrecision: true
          })
        : UNKNOWN_AMOUNT,
    [currency, currentPrice]
  )

  const priceChange = priceChange24h ?? 0

  const formattedPriceChange = useMemo(() => {
    const absPriceChange = Math.abs(priceChange)
    if (isEffectivelyZero(absPriceChange)) return undefined
    return formatCurrency({
      amount: absPriceChange,
      currency,
      boostSmallNumberPrecision: true
    })
  }, [currency, priceChange])

  const formattedPercent = useMemo(
    () =>
      priceChangePercentage24h
        ? Math.abs(priceChangePercentage24h).toFixed(2).toString() + '%'
        : undefined,
    [priceChangePercentage24h]
  )

  const status = priceChange
    ? priceChange > 0
      ? PriceChangeStatus.Up
      : priceChange < 0
      ? PriceChangeStatus.Down
      : PriceChangeStatus.Neutral
    : PriceChangeStatus.Neutral

  return { formattedPrice, formattedPriceChange, formattedPercent, status }
}
