import { DefiMarket } from 'features/defiMarket/types'
import { useCallback } from 'react'
import { encodeFunctionData } from 'viem'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { RequestContext } from 'store/rpc/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { BENQI_Q_TOKEN } from 'features/defiMarket/abis/benqiQToken'
import { MAX_UINT256 } from 'features/defiMarket/consts'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'

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
  const provider = useAvalancheEvmProvider()

  const withdraw = useCallback(
    async ({ amount }: { amount: TokenUnit }) => {
      if (!address) {
        throw new Error('No address found')
      }

      if (!provider) {
        throw new Error('No provider found')
      }

      const isMax = amount.toSubUnit() === market.asset.mintTokenBalance.balance
      // If they've selected the max amount at time of load, pass MAX_UINT256 to avoid dust remaining.
      // See: redeemFresh https://github.com/Benqi-fi/BENQI-Smart-Contracts/blob/master/lending/QiToken.sol#L632
      const withdrawAmount = isMax ? MAX_UINT256 : amount.toSubUnit()

      const txHash = await request({
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
              queryKey: [ReactQueryKeys.BENQI_ACCOUNT_SNAPSHOT]
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
