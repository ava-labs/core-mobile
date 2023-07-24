import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { BigIntWeiAvax } from 'types/denominations'

export interface StakeParamsHook {
  minStakeAmount: BigIntWeiAvax
}

export default function useStakingParams(): StakeParamsHook {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const minStakeAmount = isDeveloperMode ? BigInt(1e18) : BigInt(25e18)

  return {
    minStakeAmount
  } as StakeParamsHook
}
