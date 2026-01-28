import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useMemo } from 'react'

type UseCChainGasCostParams = {
  gasAmount: number
  additionalBuffer?: bigint
  /** Set to false to disable periodic refetch (useful for forms where gas shouldn't update during input) */
  refetchInterval?: number | false
}

/**
 * Hook to calculate gas cost with buffer for C-Chain.
 * @param gasAmount - Estimated gas units for the transaction
 * @param additionalBuffer - Multiplier for gas price buffer (default: 3x)
 * @param refetchInterval - Interval to refetch network fee (default: 30s, set false to disable)
 */
export const useCChainGasCost = ({
  gasAmount,
  additionalBuffer = 3n, // 3x buffer to account for gas price volatility and ensure transaction success
  refetchInterval
}: UseCChainGasCostParams): {
  gasCost: bigint | undefined
} => {
  const cChainNetwork = useCChainNetwork()
  const { data: networkFee } = useNetworkFee(cChainNetwork, { refetchInterval })

  const gasCost = useMemo(() => {
    if (!networkFee) return undefined

    const maxFeePerGas = networkFee.high.maxFeePerGas
    const bufferedMaxFeesPerGas = maxFeePerGas * additionalBuffer
    return bufferedMaxFeesPerGas * BigInt(gasAmount)
  }, [networkFee, gasAmount, additionalBuffer])

  return { gasCost }
}
