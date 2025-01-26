import { BigNumberish } from 'ethers'
import type { BigIntLike } from '@ethereumjs/util'

export function makeBigIntLike(
  n: BigNumberish | undefined | null
): BigIntLike | undefined {
  if (n == null) return undefined
  return ('0x' + BigInt(n).toString(16)) as BigIntLike
}
