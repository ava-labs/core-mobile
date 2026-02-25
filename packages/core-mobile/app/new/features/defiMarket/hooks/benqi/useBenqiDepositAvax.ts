import { DefiMarket } from 'features/defiMarket/types'
import { useCallback } from 'react'
import { encodeFunctionData, Hex } from 'viem'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { BENQI_QI_AVAX } from 'features/defiMarket/abis/benqiQiAvax'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { useETHSendTransaction } from 'common/hooks/useETHSendTransaction'

export const useBenqiDepositAvax = ({
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
  benqiDepositAvax: (params: { amount: TokenUnit }) => Promise<string>
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

  const benqiDepositAvax = useCallback(
    async ({ amount }: { amount: TokenUnit }) => {
      const encodedData = encodeFunctionData({
        abi: BENQI_QI_AVAX,
        functionName: 'mint',
        args: []
      })

      return sendTransaction({
        contractAddress: market.asset.mintTokenAddress,
        encodedData,
        value: `0x${amount.toSubUnit().toString(16)}` as Hex
      })
    },
    [market.asset.mintTokenAddress, sendTransaction]
  )

  return {
    benqiDepositAvax
  }
}
