import { showAlert } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { useStakeBalanceGuard } from 'features/stake/hooks/useStakeBalanceGuard'
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

  // The V2 delegate flow isn't wired up yet — surface a placeholder alert
  // so the chooser entry stays visible without silently dropping the press.
  // Skip the balance guard: there's no flow to gate, and a Buy/Swap alert
  // here would imply the path is otherwise available.
  const startDelegate = useCallback(() => {
    showAlert({
      title: 'Coming soon',
      description: 'The delegate flow is not yet available.',
      buttons: [{ text: 'OK' }]
    })
  }, [])

  return { hasEnoughAvax, canAddStake, startFastStake, startDelegate }
}
