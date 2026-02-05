import { useCallback } from 'react'
import { Address, encodeFunctionData } from 'viem'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { Network } from '@avalabs/core-chains-sdk'
import { BENQI_COMPTROLLER_C_CHAIN_ADDRESS } from 'features/defiMarket/consts'
import { BENQI_COMPTROLLER_ABI } from 'features/defiMarket/abis/benqiComptroller'

export const useBenqiSetCollateral = ({
  network
}: {
  network: Network | undefined
}): {
  setCollateral: (params: {
    qTokenAddress: Address
    useAsCollateral: boolean
  }) => Promise<string>
} => {
  const { request } = useInAppRequest()
  const provider = useAvalancheEvmProvider()
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC

  const setCollateral = useCallback(
    async ({
      qTokenAddress,
      useAsCollateral
    }: {
      qTokenAddress: Address
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

      // Benqi uses enterMarkets to enable collateral and exitMarket to disable
      const txHash = await request({
        method: RpcMethod.ETH_SEND_TRANSACTION,
        params: [
          {
            from: accountAddress,
            to: BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
            data: useAsCollateral
              ? encodeFunctionData({
                  abi: BENQI_COMPTROLLER_ABI,
                  functionName: 'enterMarkets',
                  args: [[qTokenAddress]]
                })
              : encodeFunctionData({
                  abi: BENQI_COMPTROLLER_ABI,
                  functionName: 'exitMarket',
                  args: [qTokenAddress]
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
              queryKey: [ReactQueryKeys.BENQI_AVAILABLE_MARKETS]
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
