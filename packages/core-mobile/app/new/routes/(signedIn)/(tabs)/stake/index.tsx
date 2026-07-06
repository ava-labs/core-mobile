import React from 'react'
import { Redirect } from 'expo-router'
import { StakeHomeScreen } from 'features/stake/screens/StakeHomeScreen'
import { StakeHomeScreen as StakeHomeScreenV2 } from 'features/stake/v2/screens/StakeHomeScreen'
import { useSelector } from 'react-redux'
import { selectIsFastStakeBlocked } from 'store/posthog'
import { useHasXpAddresses } from 'common/hooks/useHasXpAddresses'

const HomeScreen = (): JSX.Element => {
  const isFastStakeBlocked = useSelector(selectIsFastStakeBlocked)
  const hasXpAddresses = useHasXpAddresses()

  // Staking is a P-Chain feature. The Stake tab is registered for every account
  // so the native bottom-tab set stays stable across account switches (its
  // button is hidden when there's no X/P — see (tabs)/_layout.tsx, CP-14613).
  // Guard the screen itself so any other entry point into Stake for an account
  // without X/P addresses — a core://stake deep link, programmatic navigation,
  // navigation-state restore, or being left on the Stake tab after switching to
  // a non-X/P account (e.g. a non-primary Keystone account) — redirects to
  // Portfolio instead of mounting a stake flow that can't complete. Returning
  // here before rendering the stake screens also avoids their child hooks (e.g.
  // useStakes) firing X/P queries with empty addresses. (CP-14613)
  if (!hasXpAddresses) {
    return <Redirect href="/portfolio" />
  }

  // fast_stake_enabled flag on: show the new streamlined stake home screen
  if (!isFastStakeBlocked) {
    return <StakeHomeScreenV2 />
  }

  return <StakeHomeScreen />
}

export default HomeScreen
