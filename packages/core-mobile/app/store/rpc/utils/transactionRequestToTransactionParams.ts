import { TransactionParams } from '@avalabs/evm-module'
import { BigNumberish, TransactionRequest } from 'ethers'
import { bigIntToHex } from '@ethereumjs/util'

export const transactionRequestToTransactionParams = (
  txRequest: TransactionRequest
): TransactionParams => {
  if (typeof txRequest.from !== 'string') throw new Error('invalid from field')

  if (typeof txRequest.to !== 'string') throw new Error('invalid to field')

  const value = bigNumberishToHex(txRequest.value)
  const gas = bigNumberishToHex(txRequest.gasLimit)

  return {
    from: txRequest.from,
    to: txRequest.to,
    data: txRequest.data ?? undefined,
    value,
    gas
  }
}

const bigNumberishToHex = (
  value: BigNumberish | null | undefined
): string | undefined => {
  return typeof value === 'bigint'
    ? bigIntToHex(value)
    : typeof value === 'number' || typeof value === 'string'
    ? bigIntToHex(BigInt(value))
    : value === null || value === undefined
    ? undefined
    : value
}
