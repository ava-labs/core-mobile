import Big from 'big.js'
import { bigToBigint } from 'utils/bigNumbers/bigToBigint'

export function stringToBigint(value: string, decimals: number): bigint {
  return bigToBigint(new Big(value), decimals)
}
