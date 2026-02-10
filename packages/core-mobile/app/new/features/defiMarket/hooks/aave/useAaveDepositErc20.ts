import { DefiMarket, DepositAsset } from 'features/defiMarket/types'
import { useCallback } from 'react'
import { Address, encodeFunctionData } from 'viem'
import { AAVE_POOL_C_CHAIN_ADDRESS } from 'features/defiMarket/consts'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod, TokenType } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { AAVE_AVALANCHE3_POOL_PROXY_ABI } from 'features/defiMarket/abis/aaveAvalanche3PoolProxy'
import { ensureAllowance } from 'features/swap/utils/evm/ensureAllowance'
import { TransactionParams } from '@avalabs/evm-module'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useETHSendTransaction } from 'common/hooks/useETHSendTransaction'

export const useAaveDepositErc20 = ({
  asset,
  market,
  onConfirmed,
  onReverted,
  onError
}: {
  asset: DepositAsset
  market: DefiMarket
  onConfirmed?: () => void
  onReverted?: () => void
  onError?: () => void
}): {
  aaveDepositErc20: (params: { amount: TokenUnit }) => Promise<string>
} => {
  const { request } = useInAppRequest()
  const provider = useAvalancheEvmProvider()
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC

  const handleConfirmed = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [ReactQueryKeys.AAVE_AVAILABLE_MARKETS]
    })
    onConfirmed?.()
  }, [onConfirmed])

  const { sendTransaction } = useETHSendTransaction({
    network: market.network,
    provider,
    onConfirmed: handleConfirmed,
    onReverted,
    onError
  })

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

      // Use request directly for approve (ensureAllowance needs signAndSend)
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

      // Use sendTransaction for supply (handles waitForTransaction and callbacks)
      const encodedData = encodeFunctionData({
        abi: AAVE_AVALANCHE3_POOL_PROXY_ABI,
        functionName: 'supply',
        args: [tokenAddress, amount.toSubUnit(), accountAddress, 0]
      })

      return sendTransaction({
        contractAddress: AAVE_POOL_C_CHAIN_ADDRESS,
        encodedData
      })
    },
    [
      request,
      market.network.chainId,
      address,
      asset.token,
      provider,
      sendTransaction
    ]
  )

  return {
    aaveDepositErc20
  }
}
