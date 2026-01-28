import { useEffect, useState } from 'react'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import NetworkFeeService from 'services/networkFee/NetworkFeeService'
import Logger from 'utils/Logger'

const GAS_PRICE_BUFFER = 3n // 3x buffer to account for gas price volatility

type UseCChainGasCostParams = {
  gasLimit: number
}

/**
 * Hook to calculate estimated gas cost for C-Chain swaps.
 * Fetches network fee once (no periodic refetch) to prevent
 * validation errors from gas price fluctuations during swap flow.
 */
export const useCChainGasCost = ({
  gasLimit
}: UseCChainGasCostParams): {
  gasCost: bigint | undefined
} => {
  const cChainNetwork = useCChainNetwork()
  const [gasCost, setGasCost] = useState<bigint | undefined>(undefined)

  useEffect(() => {
    if (!cChainNetwork || gasCost !== undefined) {
      return
    }

    const fetchGasCost = async (): Promise<void> => {
      try {
        const networkFee = await NetworkFeeService.getNetworkFee(cChainNetwork)
        const maxFeePerGas = networkFee.high.maxFeePerGas
        const bufferedMaxFeesPerGas = maxFeePerGas * GAS_PRICE_BUFFER
        const calculatedGasCost = bufferedMaxFeesPerGas * BigInt(gasLimit)
        setGasCost(calculatedGasCost)
      } catch (error) {
        Logger.error('Failed to get network fee', error)
      }
    }

    fetchGasCost()
  }, [cChainNetwork, gasCost, gasLimit])

  return { gasCost }
}
