import { BigNumberish } from 'ethers'
import type { BigIntLike } from '@ethereumjs/util'
import isString from 'lodash.isstring'

const convertToHexString = (n: string): string => {
  if (n.startsWith('0x')) return n
  return `0x${n}`
}

export function makeBigIntLike(
  n: BigNumberish | undefined | null
): BigIntLike | undefined {
  if (n == null) return undefined
  if (isString(n)) {
    n = convertToHexString(n)
  }
  return ('0x' + BigInt(n).toString(16)) as BigIntLike
}
