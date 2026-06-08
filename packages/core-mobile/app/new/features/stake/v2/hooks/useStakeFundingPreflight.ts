import { useDelegationContext } from 'contexts/DelegationContext'
import { useEffect, useMemo, useState } from 'react'
import { AdditionalDelegatorOutput } from 'services/wallet/types'
import { isInsufficientFundsError } from '../utils/isInsufficientFundsError'

/**
 * Pre-flights the funding for a stake before the user commits to it.
 *
 * Recomputes the delegation steps with the convenience-fee output folded in
 * (so the check covers stake + fee + network fees, not just the stake) and
 * reports whether the balance can actually afford it. Lets the confirm screen
 * disable the CTA with an inline message instead of failing with an alert
 * *after* the processing screen has already appeared.
 *
 * Only underfunded results are surfaced as `hasInsufficientFunds`; transient
 * errors (network, etc.) are ignored here so they don't strand the user — the
 * normal submit + error-alert path handles those.
 */
export const useStakeFundingPreflight = ({
  enabled,
  stakeAmountNanoAvax,
  additionalOutputs
}: {
  /** Run the check only when the review is settled (validator + fee ready). */
  enabled: boolean
  stakeAmountNanoAvax: bigint
  /** Convenience-fee escrow output(s); undefined when no fee applies. */
  additionalOutputs: readonly AdditionalDelegatorOutput[] | undefined
}): { isCheckingFunding: boolean; hasInsufficientFunds: boolean } => {
  const { computeSteps } = useDelegationContext()
  const [fundingError, setFundingError] = useState<Error | null>(null)
  const [isCheckingFunding, setIsCheckingFunding] = useState(false)

  const additionalOutputAmount = useMemo(
    () =>
      additionalOutputs?.reduce((sum, output) => sum + output.amount, 0n) ?? 0n,
    [additionalOutputs]
  )

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setIsCheckingFunding(true)
    computeSteps(stakeAmountNanoAvax, additionalOutputAmount)
      .then(() => {
        if (!cancelled) setFundingError(null)
      })
      .catch((e: unknown) => {
        if (!cancelled) setFundingError(e as Error)
      })
      .finally(() => {
        if (!cancelled) setIsCheckingFunding(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled, stakeAmountNanoAvax, additionalOutputAmount, computeSteps])

  return {
    isCheckingFunding,
    hasInsufficientFunds: isInsufficientFundsError(fundingError)
  }
}
