import { BigNumberish, TransactionRequest } from 'ethers'
import { BigIntLike, BytesLike, AddressLike } from '@ethereumjs/util'
import isString from 'lodash.isstring'
import { LegacyTxData } from '@ethereumjs/tx'

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

export function convertTxData(txData: TransactionRequest): LegacyTxData {
  return {
    to: txData.to?.toString() as AddressLike,
    nonce: makeBigIntLike(txData.nonce),
    gasPrice: makeBigIntLike(txData.gasPrice),
    gasLimit: makeBigIntLike(txData.gasLimit),
    value: makeBigIntLike(txData.value),
    data: txData.data as BytesLike,
    type: makeBigIntLike(txData.type)
  }
}
