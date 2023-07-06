import Big from 'big.js'

/**
 * See https://docs.avax.network/subnets/reference-elastic-subnets-parameters#primary-network-parameters-on-mainnet
 * for more info on this harcoded parameter.
 */
export const MAX_VALIDATOR_WEIGHT_FACTOR = 5

/**
 * See https://docs.avax.network/subnets/reference-elastic-subnets-parameters#delegators-weight-checks
 * for more information on how max validator weight is calculated.
 * @param maxValidatorStake - Max validator stake for subnet as defined in `stakingConfig`
 * @param stakeAmount - Stake amount in nAvax
 * @returns maxWeight - The maximum validator weight in nAvax
 * @returns maxDelegation - The maximum delegation in nAvax (`maxWeight` - `stakeAmount`)
 */
export const calculateMaxWeight = (
  maxValidatorStake: Big,
  stakeAmount: Big
): { maxWeight: Big; maxDelegation: Big } => {
  const stakeWeight = stakeAmount.mul(MAX_VALIDATOR_WEIGHT_FACTOR)

  const maxWeight = stakeWeight.lt(maxValidatorStake)
    ? stakeWeight
    : maxValidatorStake
  const maxDelegation = maxWeight.sub(stakeAmount)

  return {
    maxWeight,
    maxDelegation
  }
}
