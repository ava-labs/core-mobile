import React from 'react'
import { EarnHomeScreen } from 'features/stake/screens/EarnHomeScreen'
import { NewStakeHomeScreen } from 'features/stake/screens/NewStakeHomeScreen'
import { StakeHomeScreen } from 'features/stake/screens/StakeHomeScreen'
import { useSelector } from 'react-redux'
import {
  selectIsInAppDefiBlocked,
  selectIsInAppDefiBorrowBlocked
} from 'store/posthog'

const HomeScreen = (): JSX.Element => {
  const isInAppDefiBlocked = useSelector(selectIsInAppDefiBlocked)
  const isInAppDefiBorrowBlocked = useSelector(selectIsInAppDefiBorrowBlocked)

  // Borrow feature enabled: show new stake-only screen
  if (!isInAppDefiBorrowBlocked) {
    return <NewStakeHomeScreen />
  }

  // Borrow feature disabled + DeFi enabled: show original earn screen (Stake + Deposit)
  if (!isInAppDefiBlocked) {
    return <EarnHomeScreen />
  }

  // Borrow feature disabled + DeFi blocked: show original tab-based stake screen
  return <StakeHomeScreen />
}

export default HomeScreen
