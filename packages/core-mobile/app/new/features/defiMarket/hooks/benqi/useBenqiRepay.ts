import { useCallback } from 'react'
import { encodeFunctionData, Hex } from 'viem'
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
import { BENQI_Q_TOKEN } from '../../abis/benqiQToken'
import { BENQI_QI_AVAX } from '../../abis/benqiQiAvax'
import { BENQI_QAVAX_C_CHAIN_ADDRESS } from '../../consts'
import { DefiMarket } from '../../types'

export const useBenqiRepay = ({
  market,
  onConfirmed,
  onReverted,
  onError
}: {
  market: DefiMarket
  onConfirmed?: () => void
  onReverted?: () => void
  onError?: () => void
}): {
  benqiRepay: (params: {
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
      queryKey: [ReactQueryKeys.BENQI_ACCOUNT_SNAPSHOT]
    })
    queryClient.invalidateQueries({
      queryKey: [ReactQueryKeys.BENQI_USER_BORROW_DATA]
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

  const isQiAvax =
    market?.asset?.mintTokenAddress?.toLowerCase() ===
    BENQI_QAVAX_C_CHAIN_ADDRESS.toLowerCase()

  const benqiRepay = useCallback(
    async ({
      amount,
      isMaxRepay,
      confettiDisabled
    }: {
      amount: TokenUnit
      isMaxRepay: boolean
      confettiDisabled?: boolean
    }) => {
      if (!address) {
        throw new Error('No address found')
      }

      const qTokenAddress = market.asset.mintTokenAddress

      if (isQiAvax) {
        // qiAVAX.repayBorrow() - payable, send AVAX with tx
        const repayAmount = amount.toSubUnit()

        const encodedData = encodeFunctionData({
          abi: BENQI_QI_AVAX,
          functionName: 'repayBorrow',
          args: []
        })

        return sendTransaction({
          contractAddress: qTokenAddress,
          encodedData,
          value: `0x${repayAmount.toString(16)}` as Hex,
          confettiDisabled
        })
      }

      // ERC20 qToken: repayBorrow(repayAmount)
      // User must approve qToken to spend their underlying
      const repayAmount = isMaxRepay ? 2n ** 256n - 1n : amount.toSubUnit()

      const underlyingAddress = market.asset.contractAddress
      if (!underlyingAddress) {
        throw new Error('Underlying token address not found')
      }

      const chainId = getEvmCaip2ChainId(market.network.chainId)
      const accountAddress = address

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
        amount: repayAmount,
        provider,
        signAndSend,
        spenderAddress: qTokenAddress,
        tokenAddress: underlyingAddress,
        userAddress: accountAddress
      })

      if (approvalTxHash) {
        const receipt = await provider.waitForTransaction(approvalTxHash)
        if (!receipt || receipt.status !== 1) {
          throw new Error('Approval transaction reverted')
        }
      }

      const encodedData = encodeFunctionData({
        abi: BENQI_Q_TOKEN,
        functionName: 'repayBorrow',
        args: [repayAmount]
      })

      return sendTransaction({
        contractAddress: qTokenAddress,
        encodedData,
        confettiDisabled
      })
    },
    [address, isQiAvax, market, provider, request, sendTransaction]
  )

  return { benqiRepay }
}
