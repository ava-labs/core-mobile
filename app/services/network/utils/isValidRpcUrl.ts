import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'

export async function isValidRPCUrl(
  chainId: number,
  url: string
): Promise<boolean> {
  const provider = new JsonRpcBatchInternal(
    {
      maxCalls: 40
    },
    url,
    chainId
  )

  try {
    const detectedNetwork = await provider.getNetwork()
    return detectedNetwork.chainId === chainId
  } catch (e) {
    return false
  }
}
