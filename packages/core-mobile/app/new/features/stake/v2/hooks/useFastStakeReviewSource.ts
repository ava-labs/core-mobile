import { UTCDate } from '@date-fns/utc'
import { useLocalSearchParams } from 'expo-router'
import { useStakeAmount } from 'hooks/earn/useStakeAmount'
import { secondsToMilliseconds } from 'date-fns'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectIsFastStakeFeeBlocked } from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { FAST_STAKE_FEE_RATE, getFastStakeFeeEscrowAddress } from '../constants'
import { StakeReviewSource } from '../types'
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
  const { stakeEndTime } = useLocalSearchParams<{ stakeEndTime: string }>()
  const stakingEndTime = useMemo(
    () => new UTCDate(secondsToMilliseconds(Number(stakeEndTime))),
    [stakeEndTime]
  )

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isFastStakeFeeBlocked = useSelector(selectIsFastStakeFeeBlocked)
  const isFastStakeFeeEnabled = !isFastStakeFeeBlocked

  const { data, isFetching, error } = useFastStakeNode({
    stakingAmount,
    stakingEndTime
  })

  return useMemo<StakeReviewSource>(
    () => ({
      validator: data,
      isFetching,
      error,
      feePolicy: isFastStakeFeeEnabled
        ? {
            rate: FAST_STAKE_FEE_RATE,
            recipientAddresses: [getFastStakeFeeEscrowAddress(isDeveloperMode)]
          }
        : null
    }),
    [data, isFetching, error, isFastStakeFeeEnabled, isDeveloperMode]
  )
}
