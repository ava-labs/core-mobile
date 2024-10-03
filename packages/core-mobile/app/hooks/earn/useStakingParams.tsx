import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useMemo } from 'react'
import { zeroAvaxPChain } from 'utils/units/zeroValues'
import { TokenUnit } from '@avalabs/core-utils-sdk'

export interface StakeParamsHook {
  minStakeAmount: TokenUnit
}

export default function useStakingParams(): StakeParamsHook {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const minStakeAmount = useMemo(
    () =>
      isDeveloperMode ? zeroAvaxPChain().add(1) : zeroAvaxPChain().add(25),
    [isDeveloperMode]
  )

  return {
    minStakeAmount
  } as StakeParamsHook
}
