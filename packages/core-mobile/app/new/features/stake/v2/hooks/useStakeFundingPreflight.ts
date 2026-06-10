import { useDelegationContext } from 'contexts/DelegationContext'
import { useEffect, useMemo, useRef, useState } from 'react'
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

  // Keep `computeSteps` in a ref so the effect doesn't re-run (and re-toggle
  // the CTA) just because `computeSteps` got a new identity. It's recreated
  // whenever its inputs change — notably the C-Chain base fee, which refetches
  // on a 30s interval and returns a fresh `TokenUnit` each time, plus the
  // `setSteps` call inside it re-renders this tree — so depending on it
  // directly made the check (and the disabled state) flicker repeatedly. We
  // only need to re-run when the actual inputs below change.
  const computeStepsRef = useRef(computeSteps)
  useEffect(() => {
    computeStepsRef.current = computeSteps
  }, [computeSteps])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setIsCheckingFunding(true)
    computeStepsRef
      .current(stakeAmountNanoAvax, additionalOutputAmount)
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
  }, [enabled, stakeAmountNanoAvax, additionalOutputAmount])

  return {
    isCheckingFunding,
    hasInsufficientFunds: isInsufficientFundsError(fundingError)
  }
}
