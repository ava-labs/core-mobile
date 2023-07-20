import BN from 'bn.js'

export function bnToBigint(value: BN): bigint {
  return BigInt(value.toString())
}
