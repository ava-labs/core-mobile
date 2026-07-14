import { TokenUnit } from '@avalabs/core-utils-sdk'
import { PChainTransaction } from '@avalabs/glacier-sdk'
import { addDays, addHours, getUnixTime } from 'date-fns'
import { Href, useRouter } from 'expo-router'
import { useStakeAmount } from 'hooks/earn/useStakeAmount'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { getStakingConfig } from 'services/earn/utils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import {
  applyDefaultDelegateFilters,
  beginRestakeEntry,
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
    isCompleted: boolean,
    /** Which Restake entry point the handler is wired to (analytics). */
    source: 'card' | 'detail'
  ) => (() => void) | undefined
} => {
  const { navigate } = useRouter()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const getOnRestake = useCallback(
    (
      stake: PChainTransaction,
      isCompleted: boolean,
      source: 'card' | 'detail'
    ): (() => void) | undefined => {
      if (!isCompleted) return undefined

      const params = getRestakeParams(stake)
      if (!params) return undefined

      const isFastStake = isFastStakeTx(stake, isDeveloperMode)
      if (!isFastStake && !isDelegationTx(stake)) return undefined

      return () => {
        // Restakes get their own funnel start (deliberately NOT
        // `StakeFlowStarted`); the downstream lifecycle reuses the
        // delegation events with `isRestake` set by the confirm screen.
        AnalyticsService.capture('StakeRestakeStarted', {
          isAdvanced: !isFastStake,
          source
        })
        beginRestakeEntry()
        useStakeAmount.setState(new TokenUnit(params.amountNAvax, 9, 'AVAX'))
        // Set for BOTH branches: the delegate node-gone fallback consumes it
        // as the amount/duration prefill, and `useStartStaking` treats its
        // presence as "restake leftovers pending" — a chooser-initiated flow
        // clears it and re-seeds the amount so nothing leaks (overwritten by
        // the next restake, cleared by the layout on a normal modal entry).
        setRestakePrefill({ durationDays: params.durationDays })
        // Same end-time derivation web uses (`FastStakeReview` /
        // `DelegationForm`): now + the original stake's whole-day duration,
        // plus 1h of slack — calendar-day math shifts by ±1h across DST
        // transitions, and the slack keeps a spring-forward from landing the
        // duration below the original (and below the network minimum).
        const stakeEndTime = getUnixTime(
          addHours(addDays(new Date(), params.durationDays), 1)
        )

        if (isFastStake) {
          navigate(
            `/addStakeV2/fastStake/confirm?stakeEndTime=${stakeEndTime}&preferredNodeId=${params.nodeId}` as Href
          )
          return
        }

        // If the original node has left the active set (or lost capacity),
        // the confirm route drops the user into the node picker (web parity)
        // — seed the same defaults a fresh delegate flow applies so the
        // picker behaves normally, while the prefill above keeps the
        // amount/duration steps opening with the original stake's values.
        const config = getStakingConfig(isDeveloperMode)
        applyDefaultDelegateFilters({
          minFeePercent:
            Number(config.MinDelegationFee) / PERMILLION_PER_PERCENT,
          minStakeDays: Math.floor(
            Number(config.MinStakeDuration) / SECONDS_PER_DAY
          )
        })
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
