import React from 'react'
import { EarnHomeScreen } from 'features/stake/screens/EarnHomeScreen'
import { StakeHomeScreen } from 'features/stake/screens/StakeHomeScreen'
import { useSelector } from 'react-redux'
import { selectIsInAppDefiBlocked } from 'store/posthog'

const HomeScreen = (): JSX.Element => {
  const isInAppDefiBlocked = useSelector(selectIsInAppDefiBlocked)

  return isInAppDefiBlocked ? <StakeHomeScreen /> : <EarnHomeScreen />
}

export default HomeScreen
