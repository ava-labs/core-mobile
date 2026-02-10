import { DefiMarket } from 'features/defiMarket/types'
import { useCallback } from 'react'
import { Address, encodeFunctionData } from 'viem'
import {
  AAVE_POOL_C_CHAIN_ADDRESS,
  AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS,
  MAX_UINT256
} from 'features/defiMarket/consts'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { AAVE_AVALANCHE3_POOL_PROXY_ABI } from 'features/defiMarket/abis/aaveAvalanche3PoolProxy'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { useETHSendTransaction } from 'common/hooks/useETHSendTransaction'

export const useAaveWithdraw = ({
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
  withdraw: (params: { amount: TokenUnit }) => Promise<string>
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

  const withdraw = useCallback(
    async ({ amount }: { amount: TokenUnit }) => {
      if (!address) {
        throw new Error('No address found')
      }

      const assetAddress =
        market.asset.contractAddress ?? AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS
      const isMax = amount.toSubUnit() === market.asset.mintTokenBalance.balance
      // If they've selected the max amount at time of load, pass MAX_UINT256 to avoid dust remaining.
      // See: IPool.sol#withdraw method – https://snowtrace.io/address/0x1C984121713329114d1D97f5B4Aae9D4D5BfA0eB/contract/43114/code
      const withdrawAmount = isMax ? MAX_UINT256 : amount.toSubUnit()

      const encodedData = encodeFunctionData({
        abi: AAVE_AVALANCHE3_POOL_PROXY_ABI,
        functionName: 'withdraw',
        args: [assetAddress, withdrawAmount, address as Address]
      })

      return sendTransaction({
        contractAddress: AAVE_POOL_C_CHAIN_ADDRESS,
        encodedData
      })
    },
    [market, address, sendTransaction]
  )

  return {
    withdraw
  }
}
