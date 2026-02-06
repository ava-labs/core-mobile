import { useCallback } from 'react'
import { Address, encodeFunctionData } from 'viem'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { queryClient } from 'contexts/ReactQueryProvider'
import { BENQI_COMPTROLLER_C_CHAIN_ADDRESS } from 'features/defiMarket/consts'
import { BENQI_COMPTROLLER_ABI } from 'features/defiMarket/abis/benqiComptroller'
import { useETHSendTransaction } from 'common/hooks/useETHSendTransaction'

export const useBenqiSetCollateral = ({
  network,
  provider,
  onSettled
}: {
  network: Network | undefined
  provider: JsonRpcBatchInternal | undefined
  onSettled?: (requestId?: string) => void
}): {
  setCollateral: (params: {
    qTokenAddress: Address
    useAsCollateral: boolean
    requestId?: string
  }) => Promise<string>
} => {
  const { sendTransaction } = useETHSendTransaction({
    network,
    provider,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ReactQueryKeys.BENQI_AVAILABLE_MARKETS]
      })
    },
    onSettled
  })

  const setCollateral = useCallback(
    async ({
      qTokenAddress,
      useAsCollateral,
      requestId
    }: {
      qTokenAddress: Address
      useAsCollateral: boolean
      requestId?: string
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
