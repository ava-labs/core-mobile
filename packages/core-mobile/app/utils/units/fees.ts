export function feeDenominationToBigint(
  fee: string,
  isBaseUnitRate: boolean
): bigint {
  return isBaseUnitRate ? BigInt(fee) : BigInt(fee) * BigInt(1e9)
}

export function bigIntToFeeDenomination(
  fee: bigint,
  isBaseUnitRate: boolean
): string {
  return isBaseUnitRate ? fee.toString() : (fee / BigInt(1e9)).toString()
}
