import { FujiParams, MainnetParams } from './NetworkParams'

export const getStakingConfig = (isDeveloperMode: boolean) => {
  return isDeveloperMode
    ? FujiParams.stakingConfig
    : MainnetParams.stakingConfig
}
