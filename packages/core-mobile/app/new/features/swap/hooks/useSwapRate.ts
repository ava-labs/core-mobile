import { useMemo } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { formatUnits } from 'viem'
import type { Quote } from '../types'

export const useSwapRate = ({
  quote,
  fromToken,
  toToken
}: {
  quote: Quote | null
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
}): number => {
  return useMemo(() => {
    if (!fromToken || !toToken || !quote) {
      return 0
    }

    // Type assertion needed due to complex union type
    const fromDecimals = (fromToken as { decimals?: number }).decimals
    const toDecimals = (toToken as { decimals?: number }).decimals

    if (fromDecimals === undefined) {
      throw new Error(
        `Missing decimals for token: ${fromToken.symbol ?? 'unknown'}`
      )
    }

    if (toDecimals === undefined) {
      throw new Error(
        `Missing decimals for token: ${toToken.symbol ?? 'unknown'}`
      )
    }

    const amountInDecimal = parseFloat(
      formatUnits(quote.amountIn, fromDecimals)
    )
    const amountOutDecimal = parseFloat(
      formatUnits(quote.amountOut, toDecimals)
    )

    if (amountInDecimal === 0) return 0

    return amountOutDecimal / amountInDecimal
  }, [quote, fromToken, toToken])
}
