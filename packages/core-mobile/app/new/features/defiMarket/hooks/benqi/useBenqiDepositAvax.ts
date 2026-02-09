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
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import AnalyticsService from 'services/analytics/AnalyticsService'

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
  const provider = useAvalancheEvmProvider()

  const benqiDepositAvax = useCallback(
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
            to: market.asset.mintTokenAddress,
            value: `0x${amount.toSubUnit().toString(16)}`, // hex string
            data: encodeFunctionData({
              abi: BENQI_QI_AVAX,
              functionName: 'mint',
              args: []
            })
          }
        ],
        chainId: getEvmCaip2ChainId(market.network.chainId)
      })

      // Invalidate cache and fire analytics in background after transaction is confirmed
      provider
        .waitForTransaction(txHash)
        .then(receipt => {
          if (receipt && receipt.status === 1) {
            AnalyticsService.capture('EarnDepositSuccess')
            queryClient.invalidateQueries({
              queryKey: [ReactQueryKeys.BENQI_ACCOUNT_SNAPSHOT]
            })
          } else {
            AnalyticsService.capture('EarnDepositFailure')
          }
        })
        .catch(() => {
          AnalyticsService.capture('EarnDepositFailure')
        })

      return txHash
    },
    [request, market, address, provider]
  )

  return {
    benqiDepositAvax
  }
}
