import { BIG_ZERO } from '@avalabs/core-utils-sdk'
import Big from 'big.js'

/**
 * WARNING: This method rounds the input.
 *
 * Please convert to the smallest unit possible (ie, `wei` or `nAvax`) before converting `Big` -> `bigint`.
 *  */
export const bigToBigInt = (big: Big): bigint => {
  const roundedBigString = big.round().toFixed(21).split('.')[0]
  return BigInt(roundedBigString ?? '0')
}
export const bigIntToBig = (bigInt: bigint): Big => new Big(bigInt.toString())

export const zeroIfNegative = (big: Big): Big =>
  big.gt(BIG_ZERO) ? big : BIG_ZERO
