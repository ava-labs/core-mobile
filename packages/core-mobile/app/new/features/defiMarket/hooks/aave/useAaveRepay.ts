import { useCallback } from 'react'
import { Address, encodeFunctionData, Hex } from 'viem'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { selectActiveAccount } from 'store/account'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { useETHSendTransaction } from 'common/hooks/useETHSendTransaction'
import { ensureAllowance } from 'features/swap/utils/evm/ensureAllowance'
import { TransactionParams } from '@avalabs/evm-module'
import { AAVE_AVALANCHE3_POOL_PROXY_ABI } from '../../abis/aaveAvalanche3PoolProxy'
import { AAVE_WRAPPED_AVAX_GATEWAY_ABI } from '../../abis/aaveWappedAvaxGateway'
import {
  AAVE_POOL_C_CHAIN_ADDRESS,
  AAVE_WRAPPED_AVAX_GATEWAY_ADDRESS,
  AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS,
  MAX_UINT256
} from '../../consts'
import { DefiMarket } from '../../types'

const AAVE_VARIABLE_RATE_MODE = 2

export const useAaveRepay = ({
  market,
  onConfirmed,
  onReverted,
  onError
}: {
  market?: DefiMarket
  onConfirmed?: () => void
  onReverted?: () => void
  onError?: () => void
}): {
  aaveRepay: (params: {
    amount: TokenUnit
    isMaxRepay: boolean
    confettiDisabled?: boolean
  }) => Promise<string>
} => {
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC
  const provider = useAvalancheEvmProvider()
  const { request } = useInAppRequest()

  const handleConfirmed = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [ReactQueryKeys.AAVE_AVAILABLE_MARKETS]
    })
    queryClient.invalidateQueries({
      queryKey: [ReactQueryKeys.AAVE_USER_BORROW_DATA]
    })
    queryClient.invalidateQueries({
      queryKey: [ReactQueryKeys.AAVE_USER_RESERVES_DATA]
    })
    onConfirmed?.()
  }, [onConfirmed])

  const { sendTransaction } = useETHSendTransaction({
    network: market?.network,
    provider,
    onConfirmed: handleConfirmed,
    onReverted,
    onError
  })

  const aaveRepay = useCallback(
    async ({
      amount,
      isMaxRepay,
      confettiDisabled
    }: {
      amount: TokenUnit
      isMaxRepay: boolean
      confettiDisabled?: boolean
    }) => {
      if (!market) {
        throw new Error('Market is required')
      }
      if (!address) {
        throw new Error('No address found')
      }
      if (!provider) {
        throw new Error('No provider found')
      }

      const isNativeAvax =
        !market.asset.contractAddress ||
        market.asset.contractAddress.toLowerCase() ===
          AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS.toLowerCase()

      const actualAmount = amount.toSubUnit()
      const repayAmountParam = isMaxRepay ? MAX_UINT256 : actualAmount
      const accountAddress = address as Address
      const chainId = getEvmCaip2ChainId(market.network.chainId)

      if (isNativeAvax) {
        // repayETH(pool, amount, onBehalfOf) - payable, send ETH with tx
        // amount param: MAX_UINT256 to repay full debt; value = actual ETH to send
        const encodedData = encodeFunctionData({
          abi: AAVE_WRAPPED_AVAX_GATEWAY_ABI,
          functionName: 'repayETH',
          args: [AAVE_POOL_C_CHAIN_ADDRESS, repayAmountParam, accountAddress]
        })

        return sendTransaction({
          contractAddress: AAVE_WRAPPED_AVAX_GATEWAY_ADDRESS,
          encodedData,
          value: `0x${actualAmount.toString(16)}` as Hex,
          confettiDisabled
        })
      }

      // ERC20: approve Pool then call Pool.repay()
      const tokenAddress = market.asset.contractAddress as Address

      if (!tokenAddress) {
        throw new Error('Token address not found')
      }

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

      // Approve only the actual amount being transferred (never MAX_UINT256)
      const approvalTxHash = await ensureAllowance({
        amount: actualAmount,
        provider,
        signAndSend,
        spenderAddress: AAVE_POOL_C_CHAIN_ADDRESS,
        tokenAddress,
        userAddress: accountAddress
      })

      if (approvalTxHash) {
        const receipt = await provider.waitForTransaction(approvalTxHash)
        if (!receipt || receipt.status !== 1) {
          throw new Error('Approval transaction reverted')
        }
      }

      // Pool.repay(asset, amount, interestRateMode, onBehalfOf)
      const encodedData = encodeFunctionData({
        abi: AAVE_AVALANCHE3_POOL_PROXY_ABI,
        functionName: 'repay',
        args: [
          tokenAddress,
          repayAmountParam,
          BigInt(AAVE_VARIABLE_RATE_MODE),
          accountAddress
        ]
      })

      return sendTransaction({
        contractAddress: AAVE_POOL_C_CHAIN_ADDRESS,
        encodedData,
        confettiDisabled
      })
    },
    [address, market, provider, request, sendTransaction]
  )

  return { aaveRepay }
}
