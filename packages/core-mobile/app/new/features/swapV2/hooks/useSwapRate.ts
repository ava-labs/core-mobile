import { useMemo } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { SwapQuote } from '../types'

export const useSwapRate = ({
  quote,
  fromToken,
  toToken
}: {
  quote: SwapQuote | undefined
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
}): number => {
  return useMemo(() => {
    // Return placeholder rate for UI display
    if (fromToken && toToken && quote) {
      return 1.234 // Mock exchange rate
    }
    return 0
  }, [quote, fromToken, toToken])
}
