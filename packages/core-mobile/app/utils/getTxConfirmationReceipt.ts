import {
  createPublicClient,
  http,
  WaitForTransactionReceiptReturnType
} from 'viem'
import { avalanche } from 'viem/chains'

export const getTxConfirmationReceipt = async (
  hash: string | `0x${string}`
): Promise<WaitForTransactionReceiptReturnType> => {
  const publicClient = createPublicClient({
    chain: avalanche,
    transport: http()
  })

  return publicClient.waitForTransactionReceipt({
    hash: hash as `0x${string}`
  })
}
