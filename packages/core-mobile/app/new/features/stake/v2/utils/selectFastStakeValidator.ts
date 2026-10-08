import { ActiveValidatorDetails } from '@avalabs/glacier-sdk'
import {
  FAST_STAKE_MIN_VALIDATOR_AGE_SECONDS,
  FAST_STAKE_TOP_CANDIDATES,
  MIN_VALIDATOR_REACHABILITY_PERCENT,
  REWARD_UPTIME_REQUIREMENT_PERCENT
} from '../constants'

type FastStakeCandidate = Pick<
  ActiveValidatorDetails,
  'startTimestamp' | 'uptimePerformance' | 'validatorHealth'
>

export type FastStakeSelectionContext = {
  now: number
  delegationEndTime: number
}

export const isValidatorReachable = ({
  validatorHealth
}: Pick<ActiveValidatorDetails, 'validatorHealth'>): boolean =>
  validatorHealth.reachabilityPercent > MIN_VALIDATOR_REACHABILITY_PERCENT

/**
 * Downtime the validator can still absorb before the delegation ends without
 * dropping below the reward requirement. The check runs when the delegation
 * ends, over the validator's uptime since its own start.
 */
export const getRewardHeadroomSeconds = (
  { startTimestamp, uptimePerformance }: FastStakeCandidate,
  { now, delegationEndTime }: FastStakeSelectionContext
): number =>
  (uptimePerformance / 100) * (now - startTimestamp) +
  (delegationEndTime - now) -
  (REWARD_UPTIME_REQUIREMENT_PERCENT / 100) *
    (delegationEndTime - startTimestamp)

export const isFastStakeEligible = (
  validator: FastStakeCandidate,
  context: FastStakeSelectionContext
): boolean =>
  isValidatorReachable(validator) &&
  context.now - validator.startTimestamp >= FAST_STAKE_MIN_VALIDATOR_AGE_SECONDS

/**
 * Uniform rather than capacity-weighted: capacity varies by orders of
 * magnitude, so weighting by it would funnel nearly every Fast Stake to one node.
 */
export const selectFastStakeValidator = <T extends FastStakeCandidate>(
  candidates: T[],
  { random, ...context }: FastStakeSelectionContext & { random: () => number }
): T | undefined => {
  const top = candidates
    .filter(validator => isFastStakeEligible(validator, context))
    .map(validator => ({
      validator,
      headroom: getRewardHeadroomSeconds(validator, context)
    }))
    .sort((a, b) => b.headroom - a.headroom)
    .slice(0, FAST_STAKE_TOP_CANDIDATES)

  return top[Math.floor(random() * top.length)]?.validator
}
