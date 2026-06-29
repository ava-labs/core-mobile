import { useRouter } from 'expo-router'
import { useStakeBalanceGuard } from 'features/stake/hooks/useStakeBalanceGuard'
import { resetDelegateFilters } from 'features/stake/v2/store'
import { useCallback } from 'react'

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
      // Start each Delegate flow from a clean slate so a previous session's
      // advanced filters don't carry over.
      resetDelegateFilters()
      navigate({ pathname: '/addStakeV2/delegate/selectNode' })
    } else {
      showNotEnoughAvaxAlert('delegate')
    }
  }, [navigate, canAddStake, hasEnoughAvax, showNotEnoughAvaxAlert])

  return { hasEnoughAvax, canAddStake, startFastStake, startDelegate }
}
