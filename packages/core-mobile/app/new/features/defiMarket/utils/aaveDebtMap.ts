import { Address } from 'viem'

/**
 * AAVE uses RAY units (10^27) for high-precision decimal calculations.
 * @see https://docs.aave.com/developers/guides/rates-guide
 */
export const RAY_PRECISION = 10n ** 27n

export type ReserveData = {
  underlyingAsset: Address
  variableBorrowIndex: bigint
}

export type UserReserveData = {
  underlyingAsset: Address
  scaledVariableDebt: bigint
}

/**
 * Builds a lookup map of asset addresses to their current variable borrow index.
 */
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

/**
 * Calculates the actual debt amount including accrued interest for each asset.
 *
 * AAVE stores debt as "scaled" values that must be multiplied by the
 * variableBorrowIndex to get the real debt amount with interest.
 *
 * Formula:
 *   actualDebt = scaledVariableDebt × variableBorrowIndex / RAY
 *
 * Where:
 *   - scaledVariableDebt: The normalized debt amount stored on-chain
 *   - variableBorrowIndex: Cumulative interest index that grows over time
 *   - RAY: 10^27, used for precision in AAVE calculations
 *
 * @see https://docs.aave.com/developers/guides/rates-guide#variable-borrow-balances
 */
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

    const actualDebt = (scaledDebt * borrowIndex) / RAY_PRECISION
    debtMap.set(address, actualDebt)
  }

  return debtMap
}
