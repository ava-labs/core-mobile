import { useRouter } from 'expo-router'
import { useStakeBalanceGuard } from 'features/stake/hooks/useStakeBalanceGuard'
import {
  applyDefaultDelegateFilters,
  clearRestakePrefill,
  getRestakePrefill,
  setDelegateNodeSelection
} from 'features/stake/v2/store'
import { useStakeAmount } from 'hooks/earn/useStakeAmount'
import useStakingParams from 'hooks/earn/useStakingParams'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { getStakingConfig } from 'services/earn/utils'
import { selectIsDeveloperMode } from 'store/settings/advanced'

// `MinDelegationFee` is in the [0, 1_000_000] permillion range; divide to %.
const PERMILLION_PER_PERCENT = 10000
const SECONDS_PER_DAY = 24 * 60 * 60

/**
 * V2-only hook driving the "Choose a way to start staking" chooser. Each
 * method runs the shared AVAX balance guard before continuing into its
 * amount flow; when the balance falls short it surfaces the method-specific
 * Buy/Swap alert instead of navigating.
 *
 * `canAddStake` is exposed so the chooser screen can subdue its cards
 * (and ignore taps) while the balance query is still resolving — without
 * that gate, a tap before the balance loads would treat
 * `hasEnoughAvax === undefined` as "not enough" and surface a misleading
 * Buy/Swap alert.
 */
export const useStartStaking = (): {
  hasEnoughAvax: boolean | undefined
  canAddStake: boolean
  startFastStake: () => void
  startDelegate: () => void
} => {
  const { navigate } = useRouter()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const [, setStakeAmount] = useStakeAmount()
  const { minStakeAmount } = useStakingParams()
  const { hasEnoughAvax, canAddStake, showNotEnoughAvaxAlert } =
    useStakeBalanceGuard()

  // Defensive cleanup at sub-flow entry: a restake entry seeds the shared
  // amount (and the restake prefill) before navigating, and the layout's
  // entry-time cleanup intentionally skips restake entries. Should the
  // chooser ever become reachable within a restake-opened modal (router
  // behavior change, new back affordance, deep link), starting a flow from
  // it would otherwise inherit the old stake's amount/duration. Presence of
  // the prefill is the "restake leftovers pending" marker — drop it and
  // re-seed the amount like a normal entry.
  const clearRestakeLeftovers = useCallback(() => {
    if (getRestakePrefill() === null) return
    clearRestakePrefill()
    setStakeAmount(minStakeAmount)
  }, [setStakeAmount, minStakeAmount])

  const startFastStake = useCallback(() => {
    // Balance still loading — ignore the press. The chooser also gates
    // visually via `canAddStake`, but this defends against any path that
    // bypasses the visual disabled state (e.g. accessibility activation).
    if (!canAddStake) return

    if (hasEnoughAvax) {
      // Fired only when the flow actually starts — a balance-blocked tap
      // shows the Buy/Swap alert instead and must not enter the funnel.
      AnalyticsService.capture('StakeFlowStarted', { isAdvanced: false })
      clearRestakeLeftovers()
      navigate({ pathname: '/addStakeV2/fastStake/amount' })
    } else {
      showNotEnoughAvaxAlert('fast stake')
    }
  }, [
    navigate,
    canAddStake,
    hasEnoughAvax,
    showNotEnoughAvaxAlert,
    clearRestakeLeftovers
  ])

  const startDelegate = useCallback(() => {
    // Balance still loading — ignore the press (mirrors `startFastStake`).
    if (!canAddStake) return

    if (hasEnoughAvax) {
      // Same gating rationale as `startFastStake` above.
      AnalyticsService.capture('StakeFlowStarted', { isAdvanced: true })
      clearRestakeLeftovers()
      // Seed the same default filters core-web applies on entry (uptime ≥ 75%,
      // fee ≤ network min, remaining time ≥ min stake duration) so the node
      // list opens pre-filtered to the same nodes — and so a previous session's
      // filters don't carry over. The user can adjust them in Advanced filters.
      const config = getStakingConfig(isDeveloperMode)
      applyDefaultDelegateFilters({
        minFeePercent: Number(config.MinDelegationFee) / PERMILLION_PER_PERCENT,
        minStakeDays: Math.floor(
          Number(config.MinStakeDuration) / SECONDS_PER_DAY
        )
      })
      // Defensive reset alongside the filter reseed: normal navigation always
      // overwrites the selection before it's read, but a deep link / state
      // restoration straight into a later delegate step could otherwise pick
      // up a stale node from a previous run.
      setDelegateNodeSelection([], 0)
      navigate({ pathname: '/addStakeV2/delegate/selectNode' })
    } else {
      showNotEnoughAvaxAlert('delegate')
    }
  }, [
    navigate,
    canAddStake,
    hasEnoughAvax,
    showNotEnoughAvaxAlert,
    isDeveloperMode,
    clearRestakeLeftovers
  ])

  return { hasEnoughAvax, canAddStake, startFastStake, startDelegate }
}
