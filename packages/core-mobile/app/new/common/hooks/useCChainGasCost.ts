import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useMemo } from 'react'

type UseCChainGasCostParams = {
  gasAmount: number
  additionalBuffer?: bigint
}

/**
 * Hook to calculate gas cost with buffer for C-Chain.
 * @param gasAmount - Estimated gas units for the transaction
 * @param additionalBuffer - Multiplier for gas price buffer (default: 3x)
 */
export const useCChainGasCost = ({
  gasAmount,
  additionalBuffer = 3n // 3x buffer to account for gas price volatility and ensure transaction success
}: UseCChainGasCostParams): {
  gasCost: bigint | undefined
} => {
  const cChainNetwork = useCChainNetwork()
  const { data: networkFee } = useNetworkFee(cChainNetwork)

  const gasCost = useMemo(() => {
    if (!networkFee) return undefined

    const maxFeePerGas = networkFee.high.maxFeePerGas
    const bufferedMaxFeesPerGas = maxFeePerGas * additionalBuffer
    return bufferedMaxFeesPerGas * BigInt(gasAmount)
  }, [networkFee, gasAmount, additionalBuffer])

  return { gasCost }
}
