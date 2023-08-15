/* eslint-disable react/no-unstable-nested-components */
import AppNavigation from 'navigation/AppNavigation'
import HomeSVG from 'components/svg/HomeSVG'
import WatchlistSVG from 'components/svg/WatchlistSVG'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useApplicationContext } from 'contexts/ApplicationContext'
import PortfolioStackScreen from 'navigation/wallet/PortfolioScreenStack'
import React, { useEffect, useState } from 'react'
import WatchlistTab from 'screens/watchlist/WatchlistTabView'
import TopNavigationHeader from 'navigation/TopNavigationHeader'
import { getCommonBottomTabOptions, normalTabButton } from 'navigation/NavUtils'
import EarnSVG from 'components/svg/EarnSVG'
import { usePosthogContext } from 'contexts/PosthogContext'
import { useStakes } from 'hooks/earn/useStakes'
import EarnScreenStack from './EarnScreenStack/EarnScreenStack'

export type TabNavigatorParamList = {
  [AppNavigation.Tabs.Portfolio]: { showBackButton?: boolean }
  [AppNavigation.Tabs.Watchlist]: undefined
  [AppNavigation.Tabs.Stake]: undefined
}

const Tab = createBottomTabNavigator<TabNavigatorParamList>()
const TAB_ICON_SIZE = 28

// a hook to determine whether the Earn Dashboard should be displayed
// when there are stakes (either active or completed), we display the Dashboard
// when there are no stakes, we direct users to Stake Setup flow
const useIsEarnDashboardEnabled = () => {
  const { data: stakes } = useStakes()
  const [isEarnDashboardEnabled, setIsEarnDashboardEnabled] = useState(true)

  useEffect(() => {
    if (!stakes) return

    const hasStakes = stakes.length > 0
    setIsEarnDashboardEnabled(hasStakes ? true : false)
  }, [stakes])

  return { isEarnDashboardEnabled }
}

const TabNavigator = () => {
  const theme = useApplicationContext().theme
  const { earnBlocked } = usePosthogContext()
  const { isEarnDashboardEnabled } = useIsEarnDashboardEnabled()

  const renderEarnTab = () => {
    if (earnBlocked) return null

    return (
      <Tab.Screen
        name={AppNavigation.Tabs.Stake}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) =>
            normalTabButton({
              theme,
              routeName: AppNavigation.Tabs.Stake,
              focused,
              image: <EarnSVG selected={focused} size={TAB_ICON_SIZE} />
            })
        }}
        component={EarnScreenStack}
        listeners={({ navigation }) => ({
          tabPress: e => {
            if (!isEarnDashboardEnabled) {
              e.preventDefault()
              navigation.navigate(AppNavigation.Wallet.Earn, {
                screen: AppNavigation.Earn.StakeSetup
              })
            }
          }
        })}
      />
    )
  }

  return (
    <Tab.Navigator
      screenOptions={{
        ...getCommonBottomTabOptions(theme)
      }}>
      <Tab.Screen
        name={AppNavigation.Tabs.Portfolio}
        component={PortfolioStackScreen}
        options={({ route }) => ({
          header: () => {
            const showBackButton = route.params?.showBackButton
            return (
              <TopNavigationHeader
                showAddress
                showBackButton={showBackButton}
              />
            )
          },
          tabBarIcon: ({ focused }) =>
            normalTabButton({
              theme,
              routeName: AppNavigation.Tabs.Portfolio,
              focused,
              image: <HomeSVG selected={focused} size={TAB_ICON_SIZE} />
            })
        })}
      />
      <Tab.Screen
        name={AppNavigation.Tabs.Watchlist}
        options={{
          header: () => {
            return (
              <TopNavigationHeader
                showAccountSelector={false}
                showNetworkSelector={false}
              />
            )
          },
          tabBarIcon: ({ focused }) =>
            normalTabButton({
              theme,
              routeName: AppNavigation.Tabs.Watchlist,
              focused,
              image: <WatchlistSVG selected={focused} size={TAB_ICON_SIZE} />
            })
        }}
        component={WatchlistTab}
      />
      {renderEarnTab()}
    </Tab.Navigator>
  )
}

export default TabNavigator
