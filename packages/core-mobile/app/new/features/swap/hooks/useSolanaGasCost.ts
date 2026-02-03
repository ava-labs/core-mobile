import { useMemo } from 'react'
import {
  calculateSolanaGasCost,
  CalculateSolanaGasCostParams
} from '../utils/calculateSolanaGasCost'

type UseSolanaGasCostParams = CalculateSolanaGasCostParams

/**
 * Hook to calculate estimated gas cost for Solana swaps.
 * @see calculateSolanaGasCost for implementation details
 */
export const useSolanaGasCost = ({
  fromToken,
  toToken,
  wrappedSolAtaExists,
  toTokenAtaExists
}: UseSolanaGasCostParams): {
  gasCost: bigint | undefined
} => {
  const gasCost = useMemo(
    () =>
      calculateSolanaGasCost({
        fromToken,
        toToken,
        wrappedSolAtaExists,
        toTokenAtaExists
      }),
    [fromToken, toToken, wrappedSolAtaExists, toTokenAtaExists]
  )

  return { gasCost }
}
