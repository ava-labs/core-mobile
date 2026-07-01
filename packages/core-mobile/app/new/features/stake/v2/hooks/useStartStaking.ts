import { useRouter } from 'expo-router'
import { useStakeBalanceGuard } from 'features/stake/hooks/useStakeBalanceGuard'
import { applyDefaultDelegateFilters } from 'features/stake/v2/store'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
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
  const { hasEnoughAvax, canAddStake, showNotEnoughAvaxAlert } =
    useStakeBalanceGuard()

  const startFastStake = useCallback(() => {
    // Balance still loading — ignore the press. The chooser also gates
    // visually via `canAddStake`, but this defends against any path that
    // bypasses the visual disabled state (e.g. accessibility activation).
    if (!canAddStake) return

    if (hasEnoughAvax) {
      navigate({ pathname: '/addStakeV2/fastStake/amount' })
    } else {
      showNotEnoughAvaxAlert('fast stake')
    }
  }, [navigate, canAddStake, hasEnoughAvax, showNotEnoughAvaxAlert])

  const startDelegate = useCallback(() => {
    // Balance still loading — ignore the press (mirrors `startFastStake`).
    if (!canAddStake) return

    if (hasEnoughAvax) {
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
      navigate({ pathname: '/addStakeV2/delegate/selectNode' })
    } else {
      showNotEnoughAvaxAlert('delegate')
    }
  }, [
    navigate,
    canAddStake,
    hasEnoughAvax,
    showNotEnoughAvaxAlert,
    isDeveloperMode
  ])

  return { hasEnoughAvax, canAddStake, startFastStake, startDelegate }
}
