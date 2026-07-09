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
 *
 * The check counts as complete only once `computeSteps` had all of its async
 * inputs (`isComputeReady`) and returned actual steps. Before that,
 * `computeSteps` resolves to an empty list without validating anything, which
 * must NOT enable the CTA: a restake lands directly on the confirm screen
 * with a cached validator, so the pre-flight can fire before the fee-state /
 * base-fee queries resolve — treating that empty result as "funded" let an
 * unaffordable stake through with no inline error (it then failed after the
 * slide). While the inputs are still loading we report `isCheckingFunding`
 * and re-run the real check when `isComputeReady` flips true.
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
  const { computeSteps, isComputeReady } = useDelegationContext()
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
    if (!enabled) {
      // No check should be running while the preflight is disabled. Clear the
      // flag here so a check that was cancelled mid-flight (e.g. `enabled`
      // flipped off when the reward estimate started a background refetch)
      // doesn't strand `isCheckingFunding` at `true` and leave the CTA
      // permanently disabled — its `.finally` is skipped once `cancelled` is set.
      setIsCheckingFunding(false)
      return
    }
    if (!isComputeReady) {
      // `computeSteps` would resolve to an empty list without validating
      // anything. Hold the CTA as "checking" until the inputs are ready; the
      // dep below re-runs the real check the moment they are.
      setIsCheckingFunding(true)
      return
    }
    let cancelled = false
    setIsCheckingFunding(true)
    computeStepsRef
      .current(stakeAmountNanoAvax, additionalOutputAmount)
      .then(steps => {
        if (cancelled) return
        if (steps.length === 0) {
          // An input vanished between the readiness check and the call (e.g.
          // account switch mid-flight) — nothing was validated, so don't mark
          // the check as passed. `isComputeReady` flips false for the same
          // reason and re-arms this effect, keeping the CTA held meanwhile.
          return
        }
        setFundingError(null)
        setIsCheckingFunding(false)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setFundingError(e as Error)
        setIsCheckingFunding(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled, isComputeReady, stakeAmountNanoAvax, additionalOutputAmount])

  return {
    isCheckingFunding,
    hasInsufficientFunds: isInsufficientFundsError(fundingError)
  }
}
