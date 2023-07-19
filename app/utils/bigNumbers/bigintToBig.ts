import Big from 'big.js'

export function bigintToBig(value: bigint, decimals: number): Big {
  return new Big(value.toString()).div(new Big(10).pow(decimals))
}
