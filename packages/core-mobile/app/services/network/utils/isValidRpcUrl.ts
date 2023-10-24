import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { Network } from 'ethers'

export async function isValidRPCUrl(
  chainId: number,
  url: string
): Promise<boolean> {
  const provider = new JsonRpcBatchInternal(
    {
      maxCalls: 40
    },
    url,
    new Network('', chainId)
  )

  try {
    const detectedNetwork = await provider.getNetwork()
    return detectedNetwork.chainId === BigInt(chainId)
  } catch (e) {
    return false
  }
}
