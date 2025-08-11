import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useMemo } from 'react'
import { zeroAvaxPChain } from 'utils/units/zeroValues'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { selectStakeAnnualPercentageYieldBPS } from 'store/posthog'
import { DEFAULT_ANNUAL_PERCENTAGE_YIELD_BPS } from 'features/stake/consts'

export interface StakeParamsHook {
  minStakeAmount: TokenUnit
  annualPercentageYieldBPS: number
}

export default function useStakingParams(): StakeParamsHook {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const minStakeAmount = useMemo(
    () => zeroAvaxPChain().add(isDeveloperMode ? 1 : 25),
    [isDeveloperMode]
  )

  const apyBps = useSelector(selectStakeAnnualPercentageYieldBPS)
  const annualPercentageYieldBPS =
    typeof apyBps === 'number' && Number.isFinite(apyBps)
      ? apyBps
      : DEFAULT_ANNUAL_PERCENTAGE_YIELD_BPS

  return {
    minStakeAmount,
    annualPercentageYieldBPS
  }
}
