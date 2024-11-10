export function feeDenominationToBigint(
  fee: string,
  isSimpleFeeRate: boolean
): bigint {
  return isSimpleFeeRate ? BigInt(fee) : BigInt(fee) * BigInt(1e9)
}

export function bigIntToFeeDenomination(
  fee: bigint,
  isSimpleFeeRate: boolean
): string {
  return isSimpleFeeRate ? fee.toString() : (fee / BigInt(1e9)).toString()
}
