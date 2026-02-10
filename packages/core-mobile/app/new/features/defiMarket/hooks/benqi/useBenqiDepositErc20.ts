import { DefiMarket, DepositAsset } from 'features/defiMarket/types'
import { useCallback } from 'react'
import { Address, encodeFunctionData } from 'viem'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod, TokenType } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { ensureAllowance } from 'features/swap/utils/evm/ensureAllowance'
import { TransactionParams } from '@avalabs/evm-module'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { BENQI_Q_TOKEN } from 'features/defiMarket/abis/benqiQToken'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import AnalyticsService from 'services/analytics/AnalyticsService'

export const useBenqiDepositErc20 = ({
  asset,
  market
}: {
  asset: DepositAsset
  market: DefiMarket
}): {
  benqiDepositErc20: (params: { amount: TokenUnit }) => Promise<string>
} => {
  const { request } = useInAppRequest()
  const provider = useAvalancheEvmProvider()
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC

  const benqiDepositErc20 = useCallback(
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
        spenderAddress: market.asset.mintTokenAddress,
        tokenAddress,
        userAddress: accountAddress
      })

      if (approvalTxHash) {
        const receipt = await provider.waitForTransaction(approvalTxHash)

        if (!receipt || (receipt && receipt.status !== 1)) {
          throw new Error('Transaction Reverted')
        }
      }

      const txHash = await request({
        method: RpcMethod.ETH_SEND_TRANSACTION,
        params: [
          {
            from: accountAddress,
            to: market.asset.mintTokenAddress,
            data: encodeFunctionData({
              abi: BENQI_Q_TOKEN,
              functionName: 'mint',
              args: [amount.toSubUnit()]
            })
          }
        ],
        chainId
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
    [request, market, address, asset.token, provider]
  )

  return {
    benqiDepositErc20
  }
}
