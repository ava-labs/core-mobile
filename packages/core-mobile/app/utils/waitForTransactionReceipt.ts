import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { TransactionReceipt } from 'ethers'
import { retry, RetryBackoffPolicy } from './js/retry'

export async function waitForTransactionReceipt(
  txHash: string,
  provider: JsonRpcBatchInternal
): Promise<TransactionReceipt | null> {
  return await retry<TransactionReceipt | null>({
    operation: async () => {
      return await provider.getTransactionReceipt(txHash)
    },
    shouldStop: receipt => receipt !== null,
    maxRetries: 10,
    backoffPolicy: RetryBackoffPolicy.linearThenExponential(15, 750)
  })
}
