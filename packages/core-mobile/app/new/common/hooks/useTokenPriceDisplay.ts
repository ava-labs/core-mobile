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
  formattedPrice: string
  formattedPriceChange: string | undefined
  formattedPercent: string | undefined
  status: PriceChangeStatus
}

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
    // Sub-threshold movements would format as "0.00"; drop them so callers
    // can render their own placeholder instead.
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
        ? `${Math.abs(priceChangePercentage24h).toFixed(2)}%`
        : undefined,
    [priceChangePercentage24h]
  )

  const status =
    priceChange > 0
      ? PriceChangeStatus.Up
      : priceChange < 0
      ? PriceChangeStatus.Down
      : PriceChangeStatus.Neutral

  return { formattedPrice, formattedPriceChange, formattedPercent, status }
}
