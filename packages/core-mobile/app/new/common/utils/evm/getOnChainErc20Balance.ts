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
  const contract = ERC20__factory.connect(tokenAddress, provider)
  return contract.balanceOf(userAddress)
}
