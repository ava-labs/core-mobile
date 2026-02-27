import { DefiMarket } from 'features/defiMarket/types'
import { useCallback } from 'react'
import { Address, encodeFunctionData } from 'viem'
import {
  AAVE_POOL_C_CHAIN_ADDRESS,
  AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS
} from 'features/defiMarket/consts'
import { AAVE_AVALANCHE3_POOL_PROXY_ABI } from 'features/defiMarket/abis/aaveAvalanche3PoolProxy'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { useETHSendTransaction } from 'common/hooks/useETHSendTransaction'

/**
 * Hook to borrow ERC20 tokens (including WAVAX) from AAVE Pool directly.
 * For native AVAX (unwrapped), use useAaveBorrowAvax instead.
 */
export const useAaveBorrowErc20 = ({
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
  aaveBorrowErc20: (params: {
    amount: TokenUnit
    confettiDisabled?: boolean
  }) => Promise<string>
} => {
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC
  const provider = useAvalancheEvmProvider()

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
    network: market.network,
    provider,
    onConfirmed: handleConfirmed,
    onReverted,
    onError
  })

  const aaveBorrowErc20 = useCallback(
    async ({
      amount,
      confettiDisabled
    }: {
      amount: TokenUnit
      confettiDisabled?: boolean
    }) => {
      if (!address) {
        throw new Error('No address found')
      }

      // For native AVAX market, borrow WAVAX
      const assetAddress = (market.asset.contractAddress ??
        AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS) as Address

      // borrow(asset, amount, interestRateMode, referralCode, onBehalfOf)
      // interestRateMode: 2 = variable rate (AAVE v3 only supports variable)
      const encodedData = encodeFunctionData({
        abi: AAVE_AVALANCHE3_POOL_PROXY_ABI,
        functionName: 'borrow',
        args: [assetAddress, amount.toSubUnit(), 2n, 0, address as Address]
      })

      return sendTransaction({
        contractAddress: AAVE_POOL_C_CHAIN_ADDRESS,
        encodedData,
        confettiDisabled
      })
    },
    [address, market.asset.contractAddress, sendTransaction]
  )

  return {
    aaveBorrowErc20
  }
}
