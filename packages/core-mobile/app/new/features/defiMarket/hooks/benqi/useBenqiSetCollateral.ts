import { useCallback } from 'react'
import { Address, encodeFunctionData } from 'viem'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { queryClient } from 'contexts/ReactQueryProvider'
import { BENQI_COMPTROLLER_C_CHAIN_ADDRESS } from 'features/defiMarket/consts'
import { BENQI_COMPTROLLER_ABI } from 'features/defiMarket/abis/benqiComptroller'
import { useEVMSendTransaction } from 'common/hooks/useEVMSendTransaction'

export const useBenqiSetCollateral = ({
  network,
  provider
}: {
  network: Network | undefined
  provider: JsonRpcBatchInternal | undefined
}): {
  setCollateral: (params: {
    qTokenAddress: Address
    useAsCollateral: boolean
  }) => Promise<string>
} => {
  const { sendTransaction } = useEVMSendTransaction({
    network,
    provider,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ReactQueryKeys.BENQI_AVAILABLE_MARKETS]
      })
    }
  })

  const setCollateral = useCallback(
    async ({
      qTokenAddress,
      useAsCollateral
    }: {
      qTokenAddress: Address
      useAsCollateral: boolean
    }) => {
      // Benqi uses enterMarkets to enable collateral and exitMarket to disable
      const encodedData = useAsCollateral
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

      return sendTransaction({
        contractAddress: BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
        encodedData
      })
    },
    [sendTransaction]
  )

  return {
    setCollateral
  }
}
