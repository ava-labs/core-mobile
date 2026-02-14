import { useCallback } from 'react'
import { Address, encodeFunctionData } from 'viem'
import { Network } from '@avalabs/core-chains-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { useETHSendTransaction } from 'common/hooks/useETHSendTransaction'
import { WAVAX_ADDRESS } from 'new/features/swap/consts'
import WAVAX_ABI from 'contracts/ABI_WAVAX.json'

/**
 * Hook to unwrap WAVAX to native AVAX
 */
export const useUnwrapWavax = ({
  network,
  onConfirmed,
  onReverted,
  onError
}: {
  network: Network | undefined
  onConfirmed?: () => void
  onReverted?: () => void
  onError?: () => void
}): {
  unwrapWavax: (params: { amount: TokenUnit }) => Promise<string>
} => {
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC
  const provider = useAvalancheEvmProvider()

  const { sendTransaction } = useETHSendTransaction({
    network,
    provider,
    onConfirmed,
    onReverted,
    onError
  })

  const unwrapWavax = useCallback(
    async ({ amount }: { amount: TokenUnit }) => {
      if (!address) {
        throw new Error('No address found')
      }

      // WAVAX.withdraw(amount) - burns WAVAX and sends native AVAX to caller
      const encodedData = encodeFunctionData({
        abi: WAVAX_ABI,
        functionName: 'withdraw',
        args: [amount.toSubUnit()]
      })

      return sendTransaction({
        contractAddress: WAVAX_ADDRESS as Address,
        encodedData
      })
    },
    [address, sendTransaction]
  )

  return {
    unwrapWavax
  }
}
