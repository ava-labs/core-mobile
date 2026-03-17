import { DefiMarket } from 'features/defiMarket/types'
import { useCallback } from 'react'
import { encodeFunctionData } from 'viem'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { BENQI_Q_TOKEN } from 'features/defiMarket/abis/benqiQToken'
import { MAX_UINT256 } from 'features/defiMarket/consts'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { useETHSendTransaction } from 'common/hooks/useETHSendTransaction'

export const useBenqiWithdraw = ({
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
      queryKey: [ReactQueryKeys.BENQI_ACCOUNT_SNAPSHOT]
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

      const isMax = amount.toSubUnit() === market.asset.mintTokenBalance.balance
      // If they've selected the max amount at time of load, pass MAX_UINT256 to avoid dust remaining.
      // See: redeemFresh https://github.com/Benqi-fi/BENQI-Smart-Contracts/blob/master/lending/QiToken.sol#L632
      const withdrawAmount = isMax ? MAX_UINT256 : amount.toSubUnit()

      const encodedData = encodeFunctionData({
        abi: BENQI_Q_TOKEN,
        functionName: 'redeemUnderlying',
        args: [withdrawAmount]
      })

      return sendTransaction({
        contractAddress: market.asset.mintTokenAddress,
        encodedData
      })
    },
    [market, address, sendTransaction]
  )

  return {
    withdraw
  }
}
