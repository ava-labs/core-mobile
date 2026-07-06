import { TokenUnit } from '@avalabs/core-utils-sdk'
import { PChainTransaction } from '@avalabs/glacier-sdk'
import { addDays, getUnixTime } from 'date-fns'
import { Href, useRouter } from 'expo-router'
import { useStakeAmount } from 'hooks/earn/useStakeAmount'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { getStakingConfig } from 'services/earn/utils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import {
  applyDefaultDelegateFilters,
  beginRestakeEntry,
  clearRestakePrefill,
  setDelegateNodeSelection,
  setRestakePrefill
} from '../store'
import { getRestakeParams } from '../utils/getRestakeParams'
import { isDelegationTx } from '../utils/isDelegationTx'
import { isFastStakeTx } from '../utils/isFastStakeTx'

// `MinDelegationFee` is in the [0, 1_000_000] permillion range; divide to %.
const PERMILLION_PER_PERCENT = 10000
const SECONDS_PER_DAY = 24 * 60 * 60

/**
 * Builds the Restake handler for a COMPLETED stake, or `undefined` when the
 * tx can't seed one. Mirrors core-web's `getOnRestake`
 * (`StakingNewTable.tsx`): only completed stakes restake (an active stake's
 * funds are still locked), and the original stake's amount, node and
 * duration are reused as-is — the user lands straight on the confirm screen
 * with no amount/duration steps in between. The flow branches on how the
 * stake was created:
 *
 * - Fast Stake tx → the Fast Stake confirm, which requalifies the original
 *   node (`preferredNodeId`) and falls back to auto-selection.
 * - Delegation tx → the delegate confirm, which resolves the exact original
 *   node (`restakeNodeId`, see `useAdvancedReviewSource`). When that node
 *   has left the active set, the confirm route redirects to the node picker
 *   with a notice, and the amount/duration steps open prefilled with the
 *   original stake's values (web parity — see `setRestakePrefill`).
 *
 * Both confirm screens re-run the delegation-steps computation themselves
 * (`useStakeFundingPreflight`), so skipping the amount screen's
 * `computeSteps` call is safe.
 *
 * The shared amount is seeded here, *before* navigating: `useStakeAmount` is
 * a global store, and the add-stake layout's own min-amount seeding effect
 * would otherwise overwrite the restake amount (parent effects run after
 * child effects on mount) — `beginRestakeEntry` tells the layout to skip
 * that seed for this one entry.
 */
export const useRestake = (): {
  getOnRestake: (
    stake: PChainTransaction,
    isCompleted: boolean
  ) => (() => void) | undefined
} => {
  const { navigate } = useRouter()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const getOnRestake = useCallback(
    (
      stake: PChainTransaction,
      isCompleted: boolean
    ): (() => void) | undefined => {
      if (!isCompleted) return undefined

      const params = getRestakeParams(stake)
      if (!params) return undefined

      const isFastStake = isFastStakeTx(stake, isDeveloperMode)
      if (!isFastStake && !isDelegationTx(stake)) return undefined

      return () => {
        beginRestakeEntry()
        clearRestakePrefill()
        useStakeAmount.setState(new TokenUnit(params.amountNAvax, 9, 'AVAX'))
        // Same end-time derivation web uses: now + the original stake's
        // whole-day duration.
        const stakeEndTime = getUnixTime(
          addDays(new Date(), params.durationDays)
        )

        if (isFastStake) {
          navigate(
            `/addStakeV2/fastStake/confirm?stakeEndTime=${stakeEndTime}&preferredNodeId=${params.nodeId}` as Href
          )
          return
        }

        // If the original node has left the active set, the confirm route
        // drops the user into the node picker (web parity) — seed the same
        // defaults a fresh delegate flow applies so the picker behaves
        // normally, and stash the original duration so the amount/duration
        // steps open prefilled with the original stake's values.
        const config = getStakingConfig(isDeveloperMode)
        applyDefaultDelegateFilters({
          minFeePercent:
            Number(config.MinDelegationFee) / PERMILLION_PER_PERCENT,
          minStakeDays: Math.floor(
            Number(config.MinStakeDuration) / SECONDS_PER_DAY
          )
        })
        setRestakePrefill({ durationDays: params.durationDays })
        // Clear any node left over from a previous delegate flow so the
        // confirm can't fall back to a stale selection while the restake
        // node resolves.
        setDelegateNodeSelection([], 0)
        navigate(
          `/addStakeV2/delegate/confirm?stakeEndTime=${stakeEndTime}&restakeNodeId=${params.nodeId}` as Href
        )
      }
    },
    [navigate, isDeveloperMode]
  )

  return { getOnRestake }
}
