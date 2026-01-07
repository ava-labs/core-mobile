import { DefiMarket } from 'features/deposit/types'
import { useCallback } from 'react'
import { Address, encodeFunctionData } from 'viem'
import {
  AAVE_POOL_C_CHAIN_ADDRESS,
  AAVE_WRAPPED_AVAX_GATEWAY_ADDRESS
} from 'features/deposit/consts'
import { AAVE_WRAPPED_AVAX_GATEWAY_ABI } from 'features/deposit/abis/aaveWappedAvaxGateway'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { RequestContext } from 'store/rpc'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'

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

  const aaveDepositAvax = useCallback(
    async ({ amount }: { amount: TokenUnit }) => {
      if (!address) {
        throw new Error('No address found')
      }

      return await request({
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
    aaveDepositAvax
  }
}
