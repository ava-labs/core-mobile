import { nanoToWei, weiToNano } from './converter'

export function feeDenominationToBigint(
  fee: string,
  isBaseUnitRate: boolean
): bigint {
  return isBaseUnitRate ? BigInt(fee) : nanoToWei(BigInt(fee))
}

export function bigIntToFeeDenomination(
  fee: bigint,
  isBaseUnitRate: boolean
): string {
  return isBaseUnitRate ? fee.toString() : weiToNano(fee).toString()
}
