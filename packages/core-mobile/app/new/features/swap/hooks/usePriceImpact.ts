import { useMemo } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { formatUnits } from 'viem'
import type { Quote } from '../types'

export type PriceImpactResult = {
  /**
   * Price impact as a percentage (e.g. 5.3 means 5.3%).
   * null when price data is unavailable for one or more tokens (unknown risk).
   */
  priceImpactPercent: number | null
}

/**
 * Calculates the price impact of a swap quote by comparing the fiat value
 * of the input amount vs the output amount using token market prices.
 *
 * Formula: ((fromValueInFiat - toValueInFiat) / fromValueInFiat) * 100
 *
 * Returns null (unknown risk) when price data is missing for either token.
 */
export const usePriceImpact = ({
  quote,
  fromToken,
  toToken
}: {
  quote: Quote | null | undefined
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
}): PriceImpactResult => {
  const priceImpactPercent = useMemo(() => {
    if (!quote || !fromToken || !toToken) return null

    const fromDecimals = (fromToken as { decimals?: number }).decimals
    const toDecimals = (toToken as { decimals?: number }).decimals

    if (fromDecimals === undefined || toDecimals === undefined) return null

    if (!fromToken.priceInCurrency || !toToken.priceInCurrency) return null

    const amountInDecimal = parseFloat(
      formatUnits(quote.amountIn, fromDecimals)
    )
    const amountOutDecimal = parseFloat(
      formatUnits(quote.amountOut, toDecimals)
    )

    if (amountInDecimal === 0) return null

    const fromValueInFiat = amountInDecimal * fromToken.priceInCurrency
    const toValueInFiat = amountOutDecimal * toToken.priceInCurrency

    if (fromValueInFiat === 0) return null

    // Clamp to 0: negative impact means stale/mismatched prices, not a real gain
    return Math.max(
      0,
      ((fromValueInFiat - toValueInFiat) / fromValueInFiat) * 100
    )
  }, [quote, fromToken, toToken])

  return { priceImpactPercent }
}
