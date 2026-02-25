type DepositItem = {
  valueUsd: number
  apyPercent: number
}

type BorrowItem = {
  valueUsd: number
  apyPercent: number
}

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
