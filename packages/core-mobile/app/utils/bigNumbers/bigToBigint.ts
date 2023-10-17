import Big from 'big.js'

export function bigToBigint(value: Big, decimals: number): bigint {
  return BigInt(value.mul(new Big(10).pow(decimals)).toFixed(0))
}
