import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useMemo } from 'react'

type UseCChainGasCostParams = {
  gasAmount: number
  additionalBuffer?: bigint
  /** Custom key prefix to isolate network fee query from other components */
  keyPrefix?: string
  /** Override refetch interval. Set to false to disable periodic refetch */
  refetchInterval?: number | false
}

export const useCChainGasCost = ({
  gasAmount,
  additionalBuffer = 3n, // 3x buffer to account for gas price volatility and ensure transaction success
  keyPrefix,
  refetchInterval
}: UseCChainGasCostParams): {
  gasCost: bigint | undefined
} => {
  const cChainNetwork = useCChainNetwork()
  const { data: networkFee } = useNetworkFee(cChainNetwork, {
    keyPrefix,
    refetchInterval
  })

  const gasCost = useMemo(() => {
    if (!networkFee) return undefined

    const maxFeePerGas = networkFee.high.maxFeePerGas
    const bufferedMaxFeesPerGas = maxFeePerGas * additionalBuffer
    return bufferedMaxFeesPerGas * BigInt(gasAmount)
  }, [networkFee, gasAmount, additionalBuffer])

  return { gasCost }
}
