import { useCallback } from 'react'
import { Address, encodeFunctionData } from 'viem'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { queryClient } from 'contexts/ReactQueryProvider'
import { AAVE_AVALANCHE3_POOL_PROXY_ABI } from 'features/defiMarket/abis/aaveAvalanche3PoolProxy'
import { AAVE_POOL_C_CHAIN_ADDRESS } from 'features/defiMarket/consts'
import { useEVMSendTransaction } from 'common/hooks/useEVMSendTransaction'

export const useAaveSetCollateral = ({
  network,
  provider
}: {
  network: Network | undefined
  provider: JsonRpcBatchInternal | undefined
}): {
  setCollateral: (params: {
    assetAddress: Address
    useAsCollateral: boolean
  }) => Promise<string>
} => {
  const { sendTransaction } = useEVMSendTransaction({
    network,
    provider,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ReactQueryKeys.AAVE_AVAILABLE_MARKETS]
      })
    }
  })

  const setCollateral = useCallback(
    async ({
      assetAddress,
      useAsCollateral
    }: {
      assetAddress: Address
      useAsCollateral: boolean
    }) => {
      const encodedData = encodeFunctionData({
        abi: AAVE_AVALANCHE3_POOL_PROXY_ABI,
        functionName: 'setUserUseReserveAsCollateral',
        args: [assetAddress, useAsCollateral]
      })

      return sendTransaction({
        contractAddress: AAVE_POOL_C_CHAIN_ADDRESS,
        encodedData
      })
    },
    [sendTransaction]
  )

  return {
    setCollateral
  }
}
