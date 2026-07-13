import { useLocalSearchParams } from 'expo-router'
import { useStakeAmount } from 'hooks/earn/useStakeAmount'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectIsFastStakeFeeBlocked } from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { FAST_STAKE_FEE_RATE, getFastStakeFeeEscrowAddress } from '../constants'
import { StakeReviewSource } from '../types'
import { parseStakeEndTimeParam } from '../utils/parseStakeEndTimeParam'
import { useFastStakeNode } from './useFastStakeNode'

/**
 * Fast Stake data source for `StakeConfirmScreen`.
 *
 * Bundles the two Fast Stake-specific decisions into one
 * `StakeReviewSource`:
 *
 * 1. Validator resolution via server-side Glacier filtering
 *    (`useFastStakeNode`, PRD FR-QS-5).
 * 2. Convenience-fee policy — gated on `fast-stake-fee-enabled` flag,
 *    escrowed to the Fast Stake fee address for the active network.
 *    When the flag is off, no policy is returned and the screen skips
 *    the fee output, the caption, and the analytics field.
 *
 * Pure route metadata (e.g. `isAdvanced: false` for analytics labeling)
 * is passed to the screen as a separate prop by the route wrapper, not
 * baked into the source — keeps this hook focused on data + policy.
 */
export const useFastStakeReviewSource = (): StakeReviewSource => {
  const [stakingAmount] = useStakeAmount()
  // Optional in the type because the params can be missing at runtime (deep
  // links / state restoration); the defensive parse below depends on that.
  // `preferredNodeId` only arrives on the restake path — the original
  // stake's node gets first refusal before auto-selection kicks in.
  const { stakeEndTime, preferredNodeId } = useLocalSearchParams<{
    stakeEndTime?: string
    preferredNodeId?: string
  }>()
  // Defensive parse — missing / non-finite / non-positive params yield
  // `undefined` and surface as a source error below, instead of cascading a
  // NaN into the Glacier query (which would then produce a confusing
  // "no match" alert at best, or an error toast at worst).
  const stakingEndTime = useMemo(
    () => parseStakeEndTimeParam(stakeEndTime),
    [stakeEndTime]
  )

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isFastStakeFeeBlocked = useSelector(selectIsFastStakeFeeBlocked)
  const isFastStakeFeeEnabled = !isFastStakeFeeBlocked

  // `useFastStakeNode` already treats `undefined` `stakingEndTime` as the
  // "skip query" signal, so this guards against doing a useless Glacier
  // round-trip with a bogus stake duration.
  const { data, isFetching, error } = useFastStakeNode({
    stakingAmount,
    stakingEndTime,
    preferredNodeId
  })

  return useMemo<StakeReviewSource>(() => {
    if (stakingEndTime === undefined) {
      return {
        validator: undefined,
        isFetching: false,
        error: new Error('Invalid stake duration'),
        feePolicy: null
      }
    }
    return {
      validator: data,
      isFetching,
      error,
      feePolicy: isFastStakeFeeEnabled
        ? {
            rate: FAST_STAKE_FEE_RATE,
            recipientAddresses: [getFastStakeFeeEscrowAddress(isDeveloperMode)]
          }
        : null
    }
  }, [
    stakingEndTime,
    data,
    isFetching,
    error,
    isFastStakeFeeEnabled,
    isDeveloperMode
  ])
}
