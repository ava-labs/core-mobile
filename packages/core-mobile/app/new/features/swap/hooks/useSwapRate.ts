import { useMemo } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { isEvmSwapQuote, isSvmSwapQuote, SwapQuote } from '../types'
import { calculateRate as calculateEvmRate } from '../utils/evm/calculateRate'
import { calculateRate as calculateSvmRate } from '../utils/svm/calculateRate'

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
    if (quote) {
      if (isEvmSwapQuote(quote)) {
        return calculateEvmRate(quote)
      } else if (isSvmSwapQuote(quote) && fromToken && toToken) {
        return calculateSvmRate({ quote: quote, fromToken, toToken })
      }
    }
    return 0
  }, [quote, fromToken, toToken])
}
