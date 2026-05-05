import Big from 'big.js'
import { QuickSwapMaxBuy } from 'store/settings/advanced/types'

export const isAmountOverLimit = (
  amountUsd: Big | undefined,
  maxBuy: QuickSwapMaxBuy
): boolean => {
  if (maxBuy === 'unlimited') return false
  if (amountUsd === undefined) return true
  return amountUsd.gt(new Big(maxBuy))
}
