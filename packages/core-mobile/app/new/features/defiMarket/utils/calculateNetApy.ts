import { MarketName, MarketNames } from '../types'

type DepositItem = {
  valueUsd: number
  apyPercent: number
}

type BorrowItem = {
  valueUsd: number
  apyPercent: number
}

/**
 * Calculates the Net APY (Annual Percentage Yield) for a DeFi position.
 *
 * Formula (AAVE - default):
 *   Net APY = ((Total Supply Income - Total Borrow Cost) / Net Worth) × 100
 *
 * Formula (Benqi):
 *   Net APY = ((Total Supply Income - Total Borrow Cost) / Total Deposits) × 100
 *   Benqi uses Total Deposits as denominator to match their web app.
 *
 * Where:
 *   - Total Supply Income = Σ(deposit_value × deposit_apy / 100)
 *   - Total Borrow Cost = Σ(borrow_value × borrow_apy / 100)
 *   - Net Worth = Total Deposits - Total Borrows
 *
 * @returns The net APY as a percentage, or undefined if denominator is zero or negative
 */
export const calculateNetApy = ({
  deposits,
  borrows,
  protocol
}: {
  deposits: DepositItem[]
  borrows: BorrowItem[]
  protocol?: MarketName
}): number | undefined => {
  const totalDepositsUsd = deposits.reduce((sum, d) => sum + d.valueUsd, 0)
  const totalBorrowsUsd = borrows.reduce((sum, b) => sum + b.valueUsd, 0)

  const totalSupplyIncomeUsd = deposits.reduce(
    (sum, d) => sum + (d.valueUsd * d.apyPercent) / 100,
    0
  )
  const totalBorrowCostUsd = borrows.reduce(
    (sum, b) => sum + (b.valueUsd * b.apyPercent) / 100,
    0
  )

  // Benqi uses Total Deposits as denominator to match their web app
  if (protocol === MarketNames.benqi) {
    if (totalDepositsUsd <= 0) {
      return undefined
    }
    return (
      ((totalSupplyIncomeUsd - totalBorrowCostUsd) / totalDepositsUsd) * 100
    )
  }

  // Default (AAVE): use Net Worth as denominator
  const netWorthUsd = totalDepositsUsd - totalBorrowsUsd
  if (netWorthUsd <= 0) {
    return undefined
  }
  return ((totalSupplyIncomeUsd - totalBorrowCostUsd) / netWorthUsd) * 100
}
