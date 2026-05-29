import { StakeDetailScreen } from 'features/stake/screens/StakeDetailScreen'
import { StakeDetailScreen as StakeDetailScreenV2 } from 'features/stake/v2/screens/StakeDetailScreen'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectIsFastStakeBlocked } from 'store/posthog'

const StakeDetailRoute = (): React.JSX.Element => {
  const isFastStakeBlocked = useSelector(selectIsFastStakeBlocked)

  // fast-stake-enabled flag on: show the new V2 detail screen
  if (!isFastStakeBlocked) {
    return <StakeDetailScreenV2 />
  }

  return <StakeDetailScreen />
}

export default StakeDetailRoute
