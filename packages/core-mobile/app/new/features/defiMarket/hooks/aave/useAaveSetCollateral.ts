import { useCallback } from 'react'
import { Address, encodeFunctionData } from 'viem'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { AAVE_AVALANCHE3_POOL_PROXY_ABI } from 'features/defiMarket/abis/aaveAvalanche3PoolProxy'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { Network } from '@avalabs/core-chains-sdk'
import { AAVE_POOL_C_CHAIN_ADDRESS } from 'features/defiMarket/consts'

export const useAaveSetCollateral = ({
  network
}: {
  network: Network | undefined
}): {
  setCollateral: (params: {
    assetAddress: Address
    useAsCollateral: boolean
  }) => Promise<string>
} => {
  const { request } = useInAppRequest()
  const provider = useAvalancheEvmProvider()
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC

  const setCollateral = useCallback(
    async ({
      assetAddress,
      useAsCollateral
    }: {
      assetAddress: Address
      useAsCollateral: boolean
    }) => {
      if (!provider) {
        throw new Error('No provider found')
      }

      if (!address) {
        throw new Error('No address found')
      }

      if (!network) {
        throw new Error('No network found')
      }

      const accountAddress = address as Address
      const chainId = getEvmCaip2ChainId(network.chainId)

      const txHash = await request({
        method: RpcMethod.ETH_SEND_TRANSACTION,
        params: [
          {
            from: accountAddress,
            to: AAVE_POOL_C_CHAIN_ADDRESS,
            data: encodeFunctionData({
              abi: AAVE_AVALANCHE3_POOL_PROXY_ABI,
              functionName: 'setUserUseReserveAsCollateral',
              args: [assetAddress, useAsCollateral]
            })
          }
        ],
        chainId
      })

      // Invalidate cache in background after transaction is confirmed
      provider
        .waitForTransaction(txHash)
        .then(receipt => {
          if (receipt && receipt.status === 1) {
            queryClient.invalidateQueries({
              queryKey: [ReactQueryKeys.AAVE_AVAILABLE_MARKETS]
            })
          }
        })
        .catch(() => {
          // Silently ignore - cache will be stale but not critical
        })

      return txHash
    },
    [request, network, address, provider]
  )

  return {
    setCollateral
  }
}
