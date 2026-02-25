import { Address } from 'viem'

export const RAY_PRECISION = 10n ** 27n

export type ReserveData = {
  underlyingAsset: Address
  variableBorrowIndex: bigint
}

export type UserReserveData = {
  underlyingAsset: Address
  scaledVariableDebt: bigint
}

export const buildVariableBorrowIndexMap = (
  reservesData: readonly ReserveData[]
): Map<string, bigint> => {
  const indexMap = new Map<string, bigint>()
  for (const reserve of reservesData) {
    indexMap.set(
      reserve.underlyingAsset.toLowerCase(),
      reserve.variableBorrowIndex
    )
  }
  return indexMap
}

export const buildActualDebtMap = (
  userReserves: readonly UserReserveData[],
  reservesData: readonly ReserveData[]
): Map<string, bigint> => {
  const variableBorrowIndexMap = buildVariableBorrowIndexMap(reservesData)

  const debtMap = new Map<string, bigint>()
  for (const reserve of userReserves) {
    const address = reserve.underlyingAsset.toLowerCase()
    const scaledDebt = reserve.scaledVariableDebt
    const borrowIndex = variableBorrowIndexMap.get(address) ?? RAY_PRECISION

    // actualDebt = scaledVariableDebt * variableBorrowIndex / RAY
    const actualDebt = (scaledDebt * borrowIndex) / RAY_PRECISION
    debtMap.set(address, actualDebt)
  }

  return debtMap
}
