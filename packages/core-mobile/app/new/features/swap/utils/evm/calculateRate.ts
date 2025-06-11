import { OptimalRate } from '@paraswap/sdk'
import {
  EvmSwapQuote,
  isEvmUnwrapQuote,
  isEvmWrapQuote
} from 'features/swap/types'

const getParaswapRate = (quote: OptimalRate): number => {
  const { destAmount, destDecimals, srcAmount, srcDecimals } = quote

  const destAmountNumber = parseInt(destAmount) / Math.pow(10, destDecimals)
  const sourceAmountNumber = parseInt(srcAmount) / Math.pow(10, srcDecimals)

  return destAmountNumber / sourceAmountNumber
}

export const calculateRate = (quote: EvmSwapQuote): number => {
  // wrap/unwrap always has 1:1 rate
  if (isEvmWrapQuote(quote) || isEvmUnwrapQuote(quote)) {
    return 1
  }

  return getParaswapRate(quote)
}
