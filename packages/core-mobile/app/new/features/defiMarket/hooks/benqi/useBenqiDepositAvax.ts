import { DefiMarket } from 'features/defiMarket/types'
import { useCallback } from 'react'
import { encodeFunctionData } from 'viem'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { BENQI_QI_AVAX } from 'features/defiMarket/abis/benqiQiAvax'
import { RequestContext } from 'store/rpc'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'

export const useBenqiDepositAvax = ({
  market
}: {
  market: DefiMarket
}): {
  benqiDepositAvax: (params: { amount: TokenUnit }) => Promise<string>
} => {
  const { request } = useInAppRequest()
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC

  const benqiDepositAvax = useCallback(
    async ({ amount }: { amount: TokenUnit }) => {
      if (!address) {
        throw new Error('No address found')
      }

      return await request({
        method: RpcMethod.ETH_SEND_TRANSACTION,
        params: [
          {
            from: address,
            to: market.asset.mintTokenAddress,
            value: `0x${amount.toSubUnit().toString(16)}`, // hex string
            data: encodeFunctionData({
              abi: BENQI_QI_AVAX,
              functionName: 'mint',
              args: []
            })
          }
        ],
        chainId: getEvmCaip2ChainId(market.network.chainId),
        context: {
          [RequestContext.CALLBACK_TRANSACTION_CONFIRMED]: () => {
            queryClient.invalidateQueries({
              queryKey: [ReactQueryKeys.BENQI_ACCOUNT_SNAPSHOT]
            })
          }
        }
      })
    },
    [request, market, address]
  )

  return {
    benqiDepositAvax
  }
}
