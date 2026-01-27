import { useMemo } from 'react'
import { TokenType } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance'
import {
  SOL_BASE_TX_FEE_PER_SIG,
  SOL_BASE_RENT_FEE,
  SOL_FEE_BUFFER_PERCENT
} from '../consts'

type UseSolanaGasCostParams = {
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
  /** Whether the user's Wrapped SOL ATA exists */
  wrappedSolAtaExists?: boolean
  /** Whether the destination token's ATA exists */
  toTokenAtaExists?: boolean
}

/**
 * Hook to calculate estimated gas cost for Solana swaps.
 * Based on core-web's SwapJupiter implementation.
 *
 * Solana fees include:
 * - Base transaction fee (5,000 lamports per signature)
 * - ATA rent fees (~2,039,280 lamports) for new token accounts
 * - Buffer percentage (1% of balance)
 *
 * When ATA existence is known, we can provide more accurate estimates.
 * Otherwise, we conservatively assume ATAs need to be created.
 */
export const useSolanaGasCost = ({
  fromToken,
  toToken,
  wrappedSolAtaExists,
  toTokenAtaExists
}: UseSolanaGasCostParams): {
  gasCost: bigint | undefined
} => {
  const gasCost = useMemo(() => {
    if (!fromToken?.balance || fromToken.type !== TokenType.NATIVE) {
      return undefined
    }

    // Base transaction fee
    let totalCost = SOL_BASE_TX_FEE_PER_SIG

    // Add rent fee for Wrapped SOL ATA if it doesn't exist (or unknown)
    // When swapping SOL, Jupiter wraps it first which requires an ATA
    if (wrappedSolAtaExists !== true) {
      totalCost += SOL_BASE_RENT_FEE
    }

    // If destination is SPL token, add buffer for potential ATA creations
    if (toToken?.type === TokenType.SPL) {
      // Add 2x rent fee as buffer for intermediate routes
      // Jupiter routes may require multiple intermediate ATAs
      totalCost += SOL_BASE_RENT_FEE * 2n

      // Add rent fee for destination token ATA if it doesn't exist (or unknown)
      if (toTokenAtaExists !== true) {
        totalCost += SOL_BASE_RENT_FEE
      }
    }

    // Add 1% fee buffer (calculated from balance)
    const feeBuffer = BigInt(
      Math.floor(Number(fromToken.balance) * SOL_FEE_BUFFER_PERCENT)
    )
    totalCost += feeBuffer

    return totalCost
  }, [
    fromToken?.balance,
    fromToken?.type,
    toToken?.type,
    wrappedSolAtaExists,
    toTokenAtaExists
  ])

  return { gasCost }
}
