import { DefiMarket } from 'features/deposit/types'
import { useCallback } from 'react'
import { Address, encodeFunctionData } from 'viem'
import {
  AAVE_POOL_C_CHAIN_ADDRESS,
  AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS,
  MAX_UINT256
} from 'features/deposit/consts'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { AAVE_AVALANCHE3_POOL_PROXY_ABI } from 'features/deposit/abis/aaveAvalanche3PoolProxy'
import { RequestContext } from 'store/rpc'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'

export const useAaveWithdraw = ({
  market
}: {
  market: DefiMarket
}): {
  withdraw: (params: { amount: TokenUnit }) => Promise<string>
} => {
  const { request } = useInAppRequest()
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC

  const withdraw = useCallback(
    async ({ amount }: { amount: TokenUnit }) => {
      if (!address) {
        throw new Error('No address found')
      }

      const assetAddress =
        market.asset.contractAddress ?? AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS
      const isMax = amount.toSubUnit() === market.asset.mintTokenBalance.balance
      // If they've selected the max amount at time of load, pass MAX_UINT256 to avoid dust remaining.
      // See: IPool.sol#withdraw method – https://snowtrace.io/address/0x1C984121713329114d1D97f5B4Aae9D4D5BfA0eB/contract/43114/code
      const withdrawAmount = isMax ? MAX_UINT256 : amount.toSubUnit()

      return await request({
        method: RpcMethod.ETH_SEND_TRANSACTION,
        params: [
          {
            from: address,
            to: AAVE_POOL_C_CHAIN_ADDRESS,
            data: encodeFunctionData({
              abi: AAVE_AVALANCHE3_POOL_PROXY_ABI,
              functionName: 'withdraw',
              args: [assetAddress, withdrawAmount, address as Address]
            })
          }
        ],
        chainId: getEvmCaip2ChainId(market.network.chainId),
        context: {
          [RequestContext.CALLBACK_TRANSACTION_CONFIRMED]: () => {
            queryClient.invalidateQueries({
              queryKey: [ReactQueryKeys.AAVE_AVAILABLE_MARKETS]
            })
          }
        }
      })
    },
    [request, market, address]
  )

  return {
    withdraw
  }
}
