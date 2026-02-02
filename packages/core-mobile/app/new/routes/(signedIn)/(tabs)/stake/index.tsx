import React from 'react'
import { EarnHomeScreen } from 'features/stake/screens/EarnHomeScreen'
import { StakeOnlyHomeScreen } from 'features/stake/screens/StakeOnlyHomeScreen'
import { useSelector } from 'react-redux'
import {
  selectIsInAppDefiBlocked,
  selectIsInAppDefiBorrowBlocked
} from 'store/posthog'

const HomeScreen = (): JSX.Element => {
  const isInAppDefiBlocked = useSelector(selectIsInAppDefiBlocked)
  const isInAppDefiBorrowBlocked = useSelector(selectIsInAppDefiBorrowBlocked)

  // When borrow feature is enabled, this tab shows only Stake (pure staking)
  // When borrow feature is disabled, use existing behavior (Stake or Earn based on DeFi flag)
  if (!isInAppDefiBorrowBlocked) {
    return <StakeOnlyHomeScreen />
  }

  return isInAppDefiBlocked ? <StakeOnlyHomeScreen /> : <EarnHomeScreen />
}

export default HomeScreen
