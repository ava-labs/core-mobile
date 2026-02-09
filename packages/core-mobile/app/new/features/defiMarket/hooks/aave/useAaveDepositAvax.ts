import { DefiMarket } from 'features/defiMarket/types'
import { useCallback } from 'react'
import { Address, encodeFunctionData } from 'viem'
import {
  AAVE_POOL_C_CHAIN_ADDRESS,
  AAVE_WRAPPED_AVAX_GATEWAY_ADDRESS
} from 'features/defiMarket/consts'
import { AAVE_WRAPPED_AVAX_GATEWAY_ABI } from 'features/defiMarket/abis/aaveWappedAvaxGateway'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { RequestContext } from 'store/rpc/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'

export const useAaveDepositAvax = ({
  market
}: {
  market: DefiMarket
}): {
  aaveDepositAvax: (params: { amount: TokenUnit }) => Promise<string>
} => {
  const { request } = useInAppRequest()
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC
  const provider = useAvalancheEvmProvider()

  const aaveDepositAvax = useCallback(
    async ({ amount }: { amount: TokenUnit }) => {
      if (!address) {
        throw new Error('No address found')
      }

      if (!provider) {
        throw new Error('No provider found')
      }

      const txHash = await request({
        method: RpcMethod.ETH_SEND_TRANSACTION,
        params: [
          {
            from: address,
            to: AAVE_WRAPPED_AVAX_GATEWAY_ADDRESS,
            value: `0x${amount.toSubUnit().toString(16)}`, // hex string
            data: encodeFunctionData({
              abi: AAVE_WRAPPED_AVAX_GATEWAY_ABI,
              functionName: 'depositETH',
              args: [AAVE_POOL_C_CHAIN_ADDRESS, address as Address, 0]
            })
          }
        ],
        chainId: getEvmCaip2ChainId(market.network.chainId),
        context: {
          [RequestContext.ON_CONFIRMED]: () =>
            AnalyticsService.capture('EarnDepositSuccess'),
          [RequestContext.ON_REVERTED]: () =>
            AnalyticsService.capture('EarnDepositFailure')
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
    aaveDepositAvax
  }
}
