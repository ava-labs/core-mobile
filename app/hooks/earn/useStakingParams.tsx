import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { BaseAvax } from 'types/BaseAvax'

export interface StakeParamsHook {
  minStakeAmount: BaseAvax
}

export default function useStakingParams(): StakeParamsHook {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const minStakeAmount = isDeveloperMode
    ? BaseAvax.fromBase(1)
    : BaseAvax.fromBase(25)

  return {
    minStakeAmount
  } as StakeParamsHook
}
