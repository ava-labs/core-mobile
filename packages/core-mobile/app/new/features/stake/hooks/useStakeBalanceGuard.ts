import { showAlert } from '@avalabs/k2-alpine'
import { useBuy } from 'features/meld/hooks/useBuy'
import { useIsAvaxCSupported } from 'features/meld/hooks/useIsAvaxCSupported'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { useHasEnoughAvaxToStake } from 'hooks/earn/useHasEnoughAvaxToStake'
import useStakingParams from 'hooks/earn/useStakingParams'
import { useCallback, useMemo } from 'react'

export type StakeAction = 'fast stake' | 'delegate'

/**
 * Shared AVAX balance guard for the staking entry points. Exposes whether
 * the user can stake and a "not enough AVAX" alert (with Buy / Swap shortcuts).
 *
 * The alert copy is context-aware:
 * - No `action` (legacy V1 flow): keeps the original wording.
 * - `action` provided (V2 chooser): tailors the copy to the chosen method.
 */
export const useStakeBalanceGuard = (): {
  hasEnoughAvax: boolean | undefined
  canAddStake: boolean
  showNotEnoughAvaxAlert: (action?: StakeAction) => void
} => {
  const { hasEnoughAvax } = useHasEnoughAvaxToStake()
  // `canAddStake` is true once the underlying balance query has resolved
  // either way — callers gate on this so a tap before the balance loads
  // doesn't fire the "not enough AVAX" alert against an unknown balance.
  const canAddStake = useMemo(
    () => hasEnoughAvax !== undefined,
    [hasEnoughAvax]
  )
  const { minStakeAmount } = useStakingParams()
  const { navigateToSwap } = useNavigateToSwap()
  const { navigateToBuyAmountWithAvax } = useBuy()
  const isAvaxCSupported = useIsAvaxCSupported()

  const showNotEnoughAvaxAlert = useCallback(
    (action?: StakeAction): void => {
      const buttons = []
      if (isAvaxCSupported) {
        buttons.push({
          text: 'Buy AVAX',
          onPress: navigateToBuyAmountWithAvax
        })
      }
      buttons.push({
        text: 'Swap AVAX',
        onPress: () => navigateToSwap()
      })
      buttons.push({
        text: 'Cancel'
      })

      showAlert(
        action
          ? {
              title: `A minimum of ${minStakeAmount} AVAX required to ${action}`,
              description: 'Staking your AVAX allows you to earn more AVAX',
              buttons
            }
          : {
              title: `${minStakeAmount} AVAX Minimum`,
              description: 'Staking your AVAX lets you earn more AVAX',
              buttons
            }
      )
    },
    [
      isAvaxCSupported,
      navigateToSwap,
      minStakeAmount,
      navigateToBuyAmountWithAvax
    ]
  )

  return { hasEnoughAvax, canAddStake, showNotEnoughAvaxAlert }
}
