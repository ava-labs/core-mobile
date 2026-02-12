import { DefiMarket } from 'features/defiMarket/types'
import { useCallback } from 'react'
import { encodeFunctionData } from 'viem'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { BENQI_Q_TOKEN } from 'features/defiMarket/abis/benqiQToken'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { useETHSendTransaction } from 'common/hooks/useETHSendTransaction'

/**
 * Hook to borrow tokens from Benqi.
 * Unlike AAVE, Benqi's borrow function directly transfers native AVAX for qiAVAX,
 * so no unwrapping is needed.
 *
 * The borrow function is called on the qToken contract:
 * - For ERC20: qToken.borrow(amount) - transfers the underlying ERC20
 * - For AVAX: qiAVAX.borrow(amount) - transfers native AVAX directly
 */
export const useBenqiBorrow = ({
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
  benqiBorrow: (params: { amount: TokenUnit }) => Promise<string>
} => {
  const provider = useAvalancheEvmProvider()

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

  const benqiBorrow = useCallback(
    async ({ amount }: { amount: TokenUnit }) => {
      // Benqi borrow is simple: call borrow(amount) on the qToken contract
      // For qiAVAX, this directly transfers native AVAX
      // For other qTokens, this transfers the underlying ERC20
      const encodedData = encodeFunctionData({
        abi: BENQI_Q_TOKEN,
        functionName: 'borrow',
        args: [amount.toSubUnit()]
      })

      return sendTransaction({
        contractAddress: market.asset.mintTokenAddress,
        encodedData
      })
    },
    [market.asset.mintTokenAddress, sendTransaction]
  )

  return {
    benqiBorrow
  }
}
