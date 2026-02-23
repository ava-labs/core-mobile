import { DefiMarket } from 'features/defiMarket/types'
import { useCallback } from 'react'
import { Address, encodeFunctionData, Hex } from 'viem'
import {
  AAVE_POOL_C_CHAIN_ADDRESS,
  AAVE_WRAPPED_AVAX_GATEWAY_ADDRESS
} from 'features/defiMarket/consts'
import { AAVE_WRAPPED_AVAX_GATEWAY_ABI } from 'features/defiMarket/abis/aaveWappedAvaxGateway'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { useETHSendTransaction } from 'common/hooks/useETHSendTransaction'

export const useAaveDepositAvax = ({
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
  aaveDepositAvax: (params: { amount: TokenUnit }) => Promise<string>
} => {
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC
  const provider = useAvalancheEvmProvider()

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

  const aaveDepositAvax = useCallback(
    async ({ amount }: { amount: TokenUnit }) => {
      if (!address) {
        throw new Error('No address found')
      }

      const encodedData = encodeFunctionData({
        abi: AAVE_WRAPPED_AVAX_GATEWAY_ABI,
        functionName: 'depositETH',
        args: [AAVE_POOL_C_CHAIN_ADDRESS, address as Address, 0]
      })

      return sendTransaction({
        contractAddress: AAVE_WRAPPED_AVAX_GATEWAY_ADDRESS,
        encodedData,
        value: `0x${amount.toSubUnit().toString(16)}` as Hex
      })
    },
    [address, sendTransaction]
  )

  return {
    aaveDepositAvax
  }
}
