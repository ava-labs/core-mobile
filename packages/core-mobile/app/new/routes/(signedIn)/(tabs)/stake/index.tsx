import React from 'react'
import { StakeHomeScreen } from 'features/stake/screens/StakeHomeScreen'
import { StakeHomeScreenV2 } from 'features/stake/screens/StakeHomeScreenV2'
import { useSelector } from 'react-redux'
import { selectIsFastStakeBlocked } from 'store/posthog'

const HomeScreen = (): JSX.Element => {
  const isFastStakeBlocked = useSelector(selectIsFastStakeBlocked)

  // fast_stake_enabled flag on: show the new streamlined stake home screen
  if (!isFastStakeBlocked) {
    return <StakeHomeScreenV2 />
  }

  return <StakeHomeScreen />
}

export default HomeScreen
