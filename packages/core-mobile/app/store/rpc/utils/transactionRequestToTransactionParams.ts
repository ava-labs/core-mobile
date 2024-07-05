import { TransactionParams } from '@avalabs/evm-module'
import { TransactionRequest } from 'ethers'

export const transactionRequestToTransactionParams = (
  txRequest: TransactionRequest
): TransactionParams => {
  if (
    typeof txRequest.gasLimit !== 'bigint' &&
    typeof txRequest.gasLimit !== 'number'
  )
    throw new Error('invalid gasLimit field')

  if (typeof txRequest.from !== 'string') throw new Error('invalid from field')

  if (typeof txRequest.to !== 'string') throw new Error('invalid to field')

  return {
    from: txRequest.from,
    to: txRequest.to,
    data: txRequest.data ?? undefined,
    value:
      typeof txRequest.value === 'bigint'
        ? bigIntToHex(txRequest.value)
        : undefined,
    gas: bigIntToHex(txRequest.gasLimit)
  }
}

export const bigIntToHex = (num: bigint | number): string => {
  return '0x' + num.toString(16)
}
