import { OptimalRate } from '@paraswap/sdk'
import {
  EvmSwapQuote,
  isEvmUnwrapQuote,
  isEvmWrapQuote,
  isParaswapQuote,
  MarkrQuote
} from 'features/swap/types'

const getParaswapRate = (quote: OptimalRate): number => {
  const { destAmount, destDecimals, srcAmount, srcDecimals } = quote

  const destAmountNumber = parseInt(destAmount) / Math.pow(10, destDecimals)
  const sourceAmountNumber = parseInt(srcAmount) / Math.pow(10, srcDecimals)

  return destAmountNumber / sourceAmountNumber
}

const getMarkrRate = (quote: MarkrQuote): number => {
  const { amountOut, amountIn, tokenOutDecimals, tokenInDecimals } = quote

  if (!amountOut || !amountIn || !tokenOutDecimals || !tokenInDecimals) {
    return 0
  }

  const destAmountNumber = parseInt(amountOut) / Math.pow(10, tokenOutDecimals)
  const sourceAmountNumber = parseInt(amountIn) / Math.pow(10, tokenInDecimals)

  return destAmountNumber / sourceAmountNumber
}


export const calculateRate = (quote: EvmSwapQuote): number => {
  // wrap/unwrap always has 1:1 rate
  if (isEvmWrapQuote(quote) || isEvmUnwrapQuote(quote)) {
    return 1
  }

  if (isParaswapQuote(quote)) {
    return getParaswapRate(quote)
  }

  return getMarkrRate(quote)
}
