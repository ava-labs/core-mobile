import { TransactionRequest } from 'ethers'

export interface BuildEvmTransactionParams {
  transactionRequest: TransactionRequest
  chainId: number
  maxFeePerGas: bigint | undefined
  maxPriorityFeePerGas: bigint | undefined
  gasLimit: number | undefined
  overrideData: string | undefined
}

/**
 * Builds a canonical EVM transaction object from the original request
 * and user-selected fee parameters. Used by both the gasless funding
 * path and the actual signing path to ensure the two match.
 */
export function buildEvmTransaction({
  transactionRequest,
  chainId,
  maxFeePerGas,
  maxPriorityFeePerGas,
  gasLimit,
  overrideData
}: BuildEvmTransactionParams): TransactionRequest {
  const {
    gasLimit: defaultGasLimit,
    type,
    nonce,
    data,
    from,
    to,
    value
  } = transactionRequest

  return {
    nonce,
    type,
    chainId,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasLimit: gasLimit ? BigInt(gasLimit) : defaultGasLimit,
    data: overrideData ?? data,
    from,
    to,
    value
  }
}
