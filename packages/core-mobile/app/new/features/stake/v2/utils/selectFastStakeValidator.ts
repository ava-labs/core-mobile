import { ActiveValidatorDetails } from '@avalabs/glacier-sdk'
import {
  FAST_STAKE_MIN_REWARD_HEADROOM_SECONDS,
  FAST_STAKE_MIN_VALIDATOR_AGE_SECONDS,
  FAST_STAKE_TOP_CANDIDATES,
  MIN_VALIDATOR_REACHABILITY_PERCENT,
  REWARD_UPTIME_REQUIREMENT_PERCENT
} from '../constants'

type FastStakeCandidate = Pick<
  ActiveValidatorDetails,
  'startTimestamp' | 'endTimestamp' | 'uptimePerformance' | 'validatorHealth'
>

export const isValidatorReachable = ({
  validatorHealth
}: Pick<ActiveValidatorDetails, 'validatorHealth'>): boolean =>
  validatorHealth.reachabilityPercent > MIN_VALIDATOR_REACHABILITY_PERCENT

export const getRewardHeadroomSeconds = (
  { startTimestamp, endTimestamp, uptimePerformance }: FastStakeCandidate,
  now: number
): number =>
  (uptimePerformance / 100) * (now - startTimestamp) +
  (endTimestamp - now) -
  (REWARD_UPTIME_REQUIREMENT_PERCENT / 100) * (endTimestamp - startTimestamp)

export const isFastStakeEligible = (
  validator: FastStakeCandidate,
  now: number
): boolean =>
  isValidatorReachable(validator) &&
  now - validator.startTimestamp >= FAST_STAKE_MIN_VALIDATOR_AGE_SECONDS &&
  getRewardHeadroomSeconds(validator, now) >=
    FAST_STAKE_MIN_REWARD_HEADROOM_SECONDS

/**
 * Uniform rather than capacity-weighted: capacity varies by orders of
 * magnitude, so weighting by it would funnel nearly every Fast Stake to one node.
 */
export const selectFastStakeValidator = <T extends FastStakeCandidate>(
  candidates: T[],
  { now, random }: { now: number; random: () => number }
): T | undefined => {
  const top = candidates
    .filter(validator => isFastStakeEligible(validator, now))
    .map(validator => ({
      validator,
      headroom: getRewardHeadroomSeconds(validator, now)
    }))
    .sort((a, b) => b.headroom - a.headroom)
    .slice(0, FAST_STAKE_TOP_CANDIDATES)

  return top[Math.floor(random() * top.length)]?.validator
}
