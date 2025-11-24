import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useMemo } from 'react'

type UseMaxDepositAmountParams = {
  gasAmount: number
  additionalBuffer?: bigint
}

export const useGasCost = ({
  gasAmount,
  additionalBuffer = 3n // 3x buffer to account for gas price volatility and ensure transaction success
}: UseMaxDepositAmountParams): {
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
