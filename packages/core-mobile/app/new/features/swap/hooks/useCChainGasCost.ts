import { useEffect, useState } from 'react'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import NetworkFeeService from 'services/networkFee/NetworkFeeService'
import { retry, RetryBackoffPolicy } from 'utils/js/retry'

const GAS_PRICE_BUFFER = 3n // 3x buffer to account for gas price volatility
const MAX_RETRIES = 3

type UseCChainGasCostParams = {
  gasLimit: number
}

/**
 * Hook to calculate estimated gas cost for C-Chain swaps.
 * Fetches network fee once (no periodic refetch) to prevent
 * validation errors from gas price fluctuations during swap flow.
 * Includes retry logic for transient network failures.
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

    let isCancelled = false

    const fetchGasCost = async (): Promise<void> => {
      try {
        const networkFee = await retry({
          operation: async () => NetworkFeeService.getNetworkFee(cChainNetwork),
          shouldStop: result => result !== undefined,
          maxRetries: MAX_RETRIES,
          backoffPolicy: RetryBackoffPolicy.constant(1)
        })

        if (isCancelled) return

        const maxFeePerGas = networkFee.high.maxFeePerGas
        const bufferedMaxFeesPerGas = maxFeePerGas * GAS_PRICE_BUFFER
        const calculatedGasCost = bufferedMaxFeesPerGas * BigInt(gasLimit)
        setGasCost(calculatedGasCost)
      } catch {
        // Retry exhausted, gasCost remains undefined
      }
    }

    fetchGasCost()

    return () => {
      isCancelled = true
    }
  }, [cChainNetwork, gasCost, gasLimit])

  return { gasCost }
}
