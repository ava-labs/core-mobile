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
 * Formula:
 *   Net APY = ((Total Supply Income - Total Borrow Cost) / Net Worth) × 100
 *
 * Where:
 *   - Total Supply Income = Σ(deposit_value × deposit_apy / 100)
 *   - Total Borrow Cost = Σ(borrow_value × borrow_apy / 100)
 *   - Net Worth = Total Deposits - Total Borrows
 *
 * @returns The net APY as a percentage, or undefined if net worth is zero or negative
 */
export const calculateNetApy = ({
  deposits,
  borrows
}: {
  deposits: DepositItem[]
  borrows: BorrowItem[]
}): number | undefined => {
  const totalDepositsUsd = deposits.reduce((sum, d) => sum + d.valueUsd, 0)
  const totalBorrowsUsd = borrows.reduce((sum, b) => sum + b.valueUsd, 0)
  const netWorthUsd = totalDepositsUsd - totalBorrowsUsd

  if (netWorthUsd <= 0) {
    return undefined
  }

  const totalSupplyIncomeUsd = deposits.reduce(
    (sum, d) => sum + (d.valueUsd * d.apyPercent) / 100,
    0
  )
  const totalBorrowCostUsd = borrows.reduce(
    (sum, b) => sum + (b.valueUsd * b.apyPercent) / 100,
    0
  )

  return ((totalSupplyIncomeUsd - totalBorrowCostUsd) / netWorthUsd) * 100
}
