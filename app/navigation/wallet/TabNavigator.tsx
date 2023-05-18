/* eslint-disable react/no-unstable-nested-components */
import AppNavigation from 'navigation/AppNavigation'
import HomeSVG from 'components/svg/HomeSVG'
import WatchlistSVG from 'components/svg/WatchlistSVG'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useApplicationContext } from 'contexts/ApplicationContext'
import PortfolioStackScreen from 'navigation/wallet/PortfolioScreenStack'
import React from 'react'
import WatchlistTab from 'screens/watchlist/WatchlistTabView'
import TopNavigationHeader from 'navigation/TopNavigationHeader'
import { getCommonBottomTabOptions, normalTabButton } from 'navigation/NavUtils'

export type TabNavigatorParamList = {
  [AppNavigation.Tabs.Portfolio]: { showBackButton?: boolean }
  [AppNavigation.Tabs.Watchlist]: undefined
}

const Tab = createBottomTabNavigator<TabNavigatorParamList>()
const TAB_ICON_SIZE = 28

const TabNavigator = () => {
  const theme = useApplicationContext().theme

  /**
   * Due to the use of a custom FAB as a tab icon, spacing needed to be manually manipulated
   * which required the "normal" items to be manually rendered on `options.tabBarIcon` instead of automatically handled
   * by Tab.Navigator.
   */
  return (
    <Tab.Navigator
      screenOptions={{
        ...getCommonBottomTabOptions(theme),
        header: () => <TopNavigationHeader />
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
    </Tab.Navigator>
  )
}

export default TabNavigator
