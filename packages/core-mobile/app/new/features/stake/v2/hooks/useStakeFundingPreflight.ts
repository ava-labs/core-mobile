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
 * `isCheckingFunding` is DERIVED, not set from the effect: it's true whenever
 * the check is enabled but the current inputs haven't completed a check yet.
 * Setting it from the effect left a rendered frame between "the other CTA
 * gates opened" and "the effect flipped the flag" in which the slide button
 * flashed enabled — the flicker in CP-14717. Deriving it keeps the CTA held
 * in the very same render the inputs change.
 *
 * The check counts as complete only once `computeSteps` had all of its async
 * inputs (`isComputeReady`) and returned actual steps. Before that,
 * `computeSteps` resolves to an empty list without validating anything, which
 * must NOT enable the CTA: a restake lands directly on the confirm screen
 * with a cached validator, so the pre-flight can fire before the fee-state /
 * base-fee queries resolve — treating that empty result as "funded" let an
 * unaffordable stake through with no inline error (it then failed after the
 * slide). While the inputs are still loading the check stays pending and the
 * real check runs when `isComputeReady` flips true.
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
  // The input snapshot the last completed check validated — null when nothing
  // has been validated yet (or the preflight was disabled in between).
  const [checkedKey, setCheckedKey] = useState<string | null>(null)

  const additionalOutputAmount = useMemo(
    () =>
      additionalOutputs?.reduce((sum, output) => sum + output.amount, 0n) ?? 0n,
    [additionalOutputs]
  )

  const inputsKey = `${stakeAmountNanoAvax}:${additionalOutputAmount}`
  // Synchronous by design (see the flicker note in the JSDoc): the moment the
  // inputs change — or the check becomes enabled — this reads pending in the
  // same render, with no effect-timing gap for the CTA to flash enabled in.
  const isCheckingFunding = enabled && checkedKey !== inputsKey

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
      // Invalidate the completed check so re-enabling re-runs it — the
      // balance may have moved while the preflight was disabled (e.g. during
      // a reward-estimate refetch).
      setCheckedKey(null)
      return
    }
    // Current inputs already validated — nothing to do.
    if (checkedKey === inputsKey) return
    // `computeSteps` would resolve to an empty list without validating
    // anything. The derived pending state above already holds the CTA; the
    // dep below re-runs the real check the moment the inputs are ready.
    if (!isComputeReady) return

    let cancelled = false
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
        setCheckedKey(inputsKey)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setFundingError(e as Error)
        setCheckedKey(inputsKey)
      })
    return () => {
      cancelled = true
    }
  }, [
    enabled,
    isComputeReady,
    checkedKey,
    inputsKey,
    stakeAmountNanoAvax,
    additionalOutputAmount
  ])

  return {
    isCheckingFunding,
    hasInsufficientFunds: isInsufficientFundsError(fundingError)
  }
}
