import { DefiMarket } from 'features/defiMarket/types'
import { useCallback } from 'react'
import { encodeFunctionData } from 'viem'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { BENQI_Q_TOKEN } from 'features/defiMarket/abis/benqiQToken'
import { MAX_UINT256 } from 'features/defiMarket/consts'
import { RequestContext } from 'store/rpc'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'

export const useBenqiWithdraw = ({
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

      const isMax = amount.toSubUnit() === market.asset.mintTokenBalance.balance
      // If they've selected the max amount at time of load, pass MAX_UINT256 to avoid dust remaining.
      // See: redeemFresh https://github.com/Benqi-fi/BENQI-Smart-Contracts/blob/master/lending/QiToken.sol#L632
      const withdrawAmount = isMax ? MAX_UINT256 : amount.toSubUnit()

      return await request({
        method: RpcMethod.ETH_SEND_TRANSACTION,
        params: [
          {
            from: address,
            to: market.asset.mintTokenAddress,
            data: encodeFunctionData({
              abi: BENQI_Q_TOKEN,
              functionName: 'redeemUnderlying',
              args: [withdrawAmount]
            })
          }
        ],
        chainId: getEvmCaip2ChainId(market.network.chainId),
        context: {
          [RequestContext.CALLBACK_TRANSACTION_CONFIRMED]: () => {
            queryClient.invalidateQueries({
              queryKey: [ReactQueryKeys.BENQI_AVAILABLE_MARKETS]
            })
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
    withdraw
  }
}
