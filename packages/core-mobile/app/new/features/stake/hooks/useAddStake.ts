import { useRouter } from 'expo-router'
import {
  StakeAction,
  useStakeBalanceGuard
} from 'features/stake/hooks/useStakeBalanceGuard'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectIsFastStakeBlocked } from 'store/posthog'

/**
 * Shared stake entry point used by the generic "stake" affordances (the V1
 * stake card, token detail, track). Routes to the right flow based on the
 * fast-stake flag:
 * - V2 (fast stake enabled): always opens the `/addStakeV2` chooser, which
 *   defers the balance guard to staking-method selection.
 * - V1 (fast stake blocked): opens `/addStake` when funded, otherwise shows
 *   the Buy/Swap alert up front.
 *
 * V2-chooser-specific logic lives in `features/stake/v2/hooks/useStartStaking`.
 */
export const useAddStake = (): {
  addStake: () => void
  canAddStake: boolean
  hasEnoughAvax: boolean | undefined
  showNotEnoughAvaxAlert: (action?: StakeAction) => void
} => {
  const { navigate } = useRouter()
  const { hasEnoughAvax, canAddStake, showNotEnoughAvaxAlert } =
    useStakeBalanceGuard()
  const isFastStakeBlocked = useSelector(selectIsFastStakeBlocked)
  const isFastStakeEnabled = !isFastStakeBlocked

  const addStake = useCallback(() => {
    if (!canAddStake) return

    if (isFastStakeEnabled) {
      navigate('/addStakeV2')
    } else if (hasEnoughAvax) {
      // @ts-ignore TODO: make routes typesafe
      navigate('/addStake')
    } else {
      showNotEnoughAvaxAlert()
    }
  }, [
    navigate,
    canAddStake,
    hasEnoughAvax,
    showNotEnoughAvaxAlert,
    isFastStakeEnabled
  ])

  return { addStake, canAddStake, hasEnoughAvax, showNotEnoughAvaxAlert }
}
