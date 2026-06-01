import { useMemo } from 'react'
import type { LocalTokenWithBalance } from 'store/balance'
import { useInfoChains } from '../services/InfoChainsService'

export type EligibilityReason =
  | 'cross-chain'
  | 'unsupported-source-chain'
  | 'unsupported-token'
  | 'no-evm-address'

export type Eligibility =
  | { eligible: true; minimumAmount: string; minIntervalSeconds: number }
  | { eligible: false; reason: EligibilityReason }

export function useRecurringEligibility(
  fromToken: LocalTokenWithBalance | undefined,
  toToken: LocalTokenWithBalance | undefined,
  ownerAddress: string | undefined
): Eligibility {
  const { data: chains } = useInfoChains()

  return useMemo<Eligibility>(() => {
    if (!ownerAddress) return { eligible: false, reason: 'no-evm-address' }
    if (!fromToken || !toToken) return { eligible: false, reason: 'unsupported-token' }
    if (fromToken.networkChainId !== toToken.networkChainId) {
      return { eligible: false, reason: 'cross-chain' }
    }
    const chain = chains?.find(c => c.chainId === fromToken.networkChainId)
    if (!chain?.recurring?.enabled) {
      return { eligible: false, reason: 'unsupported-source-chain' }
    }
    // Native/BTC/SVM tokens have no `address`; they can't be a recurring source.
    if (!('address' in fromToken)) {
      return { eligible: false, reason: 'unsupported-token' }
    }
    const fromAddress = fromToken.address.toLowerCase()
    const supportedToken = chain.recurring.supportedTokens?.find(
      t => t.address.toLowerCase() === fromAddress
    )
    if (!supportedToken) return { eligible: false, reason: 'unsupported-token' }

    return {
      eligible: true,
      minimumAmount: supportedToken.minimumAmount,
      // Fail-safe default: if the server response is missing the floor, treat
      // it as the documented 5-minute minimum rather than letting through tighter
      // intervals the orchestrator would reject.
      minIntervalSeconds: chain.recurring.minFrequencySeconds ?? 300
    }
  }, [fromToken, toToken, ownerAddress, chains])
}
