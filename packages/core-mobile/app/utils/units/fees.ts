export function feeDenominationToBigint(
  fee: string,
  isBtcNetwork: boolean
): bigint {
  return isBtcNetwork ? BigInt(fee) : BigInt(fee) * BigInt(1e9)
}

export function bigIntToFeeDenomination(
  fee: bigint,
  isBtcNetwork: boolean
): string {
  return isBtcNetwork ? fee.toString() : (fee / BigInt(1e9)).toString()
}
