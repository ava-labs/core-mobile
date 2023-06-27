import BN from 'bn.js'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import Big from 'big.js'
import EarnService from 'services/earn/EarnService'

export const useEarnCalcEstimatedRewards = (
  amount: Big,
  duration: number,
  currentSupply: Big
): BN => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const rewardStr = EarnService.calcReward(
    amount,
    duration,
    currentSupply,
    2,
    isDeveloperMode
  )
  return new BN(rewardStr)
}
