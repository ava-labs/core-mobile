import { OptimalRate } from 'paraswap-core'

export const calculateRate = (optimalRate: OptimalRate) => {
  const { destAmount, destDecimals, srcAmount, srcDecimals } = optimalRate
  const destAmountNumber = parseInt(destAmount) / Math.pow(10, destDecimals)
  const sourceAmountNumber = parseInt(srcAmount) / Math.pow(10, srcDecimals)
  return destAmountNumber / sourceAmountNumber
}
