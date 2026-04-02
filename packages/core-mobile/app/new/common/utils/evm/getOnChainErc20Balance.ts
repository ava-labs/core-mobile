import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { ERC20__factory } from 'contracts/openzeppelin'

export async function getOnChainErc20Balance({
  tokenAddress,
  userAddress,
  provider
}: {
  tokenAddress: string
  userAddress: string
  provider: JsonRpcBatchInternal
}): Promise<bigint> {
  try {
    const contract = ERC20__factory.connect(tokenAddress, provider)
    return await contract.balanceOf(userAddress)
  } catch {
    throw new Error(
      `Failed to verify on-chain balance for token ${tokenAddress}`
    )
  }
}
