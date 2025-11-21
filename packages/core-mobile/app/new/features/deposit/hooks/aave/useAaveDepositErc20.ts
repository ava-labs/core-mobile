import { DefiMarket, DepositAsset } from 'features/deposit/types'
import { useCallback } from 'react'
import { Address, encodeFunctionData } from 'viem'
import { AAVE_POOL_C_CHAIN_ADDRESS } from 'features/deposit/consts'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod, TokenType } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { AAVE_AVALANCHE3_POOL_PROXY_ABI } from 'features/deposit/abis/aaveAvalanche3PoolProxy'
import { ensureAllowance } from 'features/swap/utils/evm/ensureAllowance'
import { TransactionParams } from '@avalabs/evm-module'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'

export const useAaveDepositErc20 = ({
  asset,
  market
}: {
  asset: DepositAsset
  market: DefiMarket
}): {
  aaveDepositErc20: (params: { amount: TokenUnit }) => Promise<string>
} => {
  const { request } = useInAppRequest()
  const provider = useAvalancheEvmProvider()
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC

  const aaveDepositErc20 = useCallback(
    async ({ amount }: { amount: TokenUnit }) => {
      if (!provider) {
        throw new Error('No provider found')
      }

      if (!address) {
        throw new Error('No address found')
      }

      if (asset.token.type !== TokenType.ERC20) {
        throw new Error('Token type is not ERC20')
      }

      const tokenAddress = asset.token.address as Address
      const accountAddress = address as Address
      const chainId = getEvmCaip2ChainId(market.network.chainId)

      const signAndSend = (
        txParams: [TransactionParams],
        context?: Record<string, unknown>
      ): Promise<string> =>
        request({
          method: RpcMethod.ETH_SEND_TRANSACTION,
          params: txParams,
          chainId,
          context
        })

      const approvalTxHash = await ensureAllowance({
        amount: amount.toSubUnit(),
        provider,
        signAndSend,
        spenderAddress: AAVE_POOL_C_CHAIN_ADDRESS,
        tokenAddress,
        userAddress: accountAddress
      })

      if (approvalTxHash) {
        const receipt = await provider.waitForTransaction(approvalTxHash)

        if (!receipt || (receipt && receipt.status !== 1)) {
          throw new Error('Transaction Reverted')
        }
      }

      return await request({
        method: RpcMethod.ETH_SEND_TRANSACTION,
        params: [
          {
            from: accountAddress,
            to: AAVE_POOL_C_CHAIN_ADDRESS,
            data: encodeFunctionData({
              abi: AAVE_AVALANCHE3_POOL_PROXY_ABI,
              functionName: 'supply',
              args: [tokenAddress, amount.toSubUnit(), accountAddress, 0]
            })
          }
        ],
        chainId
      })
    },
    [request, market, address, asset.token, provider]
  )

  return {
    aaveDepositErc20
  }
}
