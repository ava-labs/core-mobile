import { OptimalRate } from '@paraswap/sdk'

export const calculateRate = (optimalRate: OptimalRate): number => {
  const { destAmount, destDecimals, srcAmount, srcDecimals } = optimalRate
  const destAmountNumber = parseInt(destAmount) / Math.pow(10, destDecimals)
  const sourceAmountNumber = parseInt(srcAmount) / Math.pow(10, srcDecimals)
  return destAmountNumber / sourceAmountNumber
}
