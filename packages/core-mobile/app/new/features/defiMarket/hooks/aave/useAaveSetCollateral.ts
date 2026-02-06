import { useCallback } from 'react'
import { Address, encodeFunctionData } from 'viem'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { queryClient } from 'contexts/ReactQueryProvider'
import { AAVE_AVALANCHE3_POOL_PROXY_ABI } from 'features/defiMarket/abis/aaveAvalanche3PoolProxy'
import { AAVE_POOL_C_CHAIN_ADDRESS } from 'features/defiMarket/consts'
import { useETHSendTransaction } from 'common/hooks/useETHSendTransaction'

export const useAaveSetCollateral = ({
  network,
  provider,
  onSettled
}: {
  network: Network | undefined
  provider: JsonRpcBatchInternal | undefined
  onSettled?: (requestId?: string) => void
}): {
  setCollateral: (params: {
    assetAddress: Address
    useAsCollateral: boolean
    requestId?: string
  }) => Promise<string>
} => {
  const { sendTransaction } = useETHSendTransaction({
    network,
    provider,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ReactQueryKeys.AAVE_AVAILABLE_MARKETS]
      })
    },
    onSettled
  })

  const setCollateral = useCallback(
    async ({
      assetAddress,
      useAsCollateral,
      requestId
    }: {
      assetAddress: Address
      useAsCollateral: boolean
      requestId?: string
    }) => {
      const encodedData = encodeFunctionData({
        abi: AAVE_AVALANCHE3_POOL_PROXY_ABI,
        functionName: 'setUserUseReserveAsCollateral',
        args: [assetAddress, useAsCollateral]
      })

      return sendTransaction({
        contractAddress: AAVE_POOL_C_CHAIN_ADDRESS,
        encodedData,
        requestId
      })
    },
    [sendTransaction]
  )

  return {
    setCollateral
  }
}
