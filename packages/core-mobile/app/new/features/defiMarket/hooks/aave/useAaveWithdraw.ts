import { DefiMarket } from 'features/defiMarket/types'
import { useCallback } from 'react'
import { Address, encodeFunctionData } from 'viem'
import {
  AAVE_POOL_C_CHAIN_ADDRESS,
  AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS,
  MAX_UINT256
} from 'features/defiMarket/consts'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { RequestContext } from 'store/rpc/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { AAVE_AVALANCHE3_POOL_PROXY_ABI } from 'features/defiMarket/abis/aaveAvalanche3PoolProxy'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'

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
  const provider = useAvalancheEvmProvider()

  const withdraw = useCallback(
    async ({ amount }: { amount: TokenUnit }) => {
      if (!address) {
        throw new Error('No address found')
      }

      if (!provider) {
        throw new Error('No provider found')
      }

      const assetAddress =
        market.asset.contractAddress ?? AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS
      const isMax = amount.toSubUnit() === market.asset.mintTokenBalance.balance
      // If they've selected the max amount at time of load, pass MAX_UINT256 to avoid dust remaining.
      // See: IPool.sol#withdraw method – https://snowtrace.io/address/0x1C984121713329114d1D97f5B4Aae9D4D5BfA0eB/contract/43114/code
      const withdrawAmount = isMax ? MAX_UINT256 : amount.toSubUnit()

      const txHash = await request({
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
          [RequestContext.ON_CONFIRMED]: () =>
            AnalyticsService.capture('EarnWithdrawSuccess'),
          [RequestContext.ON_REVERTED]: () =>
            AnalyticsService.capture('EarnWithdrawFailure')
        }
      })

      // Invalidate cache in background after transaction is confirmed
      provider
        .waitForTransaction(txHash)
        .then(receipt => {
          if (receipt && receipt.status === 1) {
            queryClient.invalidateQueries({
              queryKey: [ReactQueryKeys.AAVE_AVAILABLE_MARKETS]
            })
          }
        })
        .catch(() => {
          // Silently ignore - cache will be stale but not critical
        })

      return txHash
    },
    [request, market, address, provider]
  )

  return {
    withdraw
  }
}
