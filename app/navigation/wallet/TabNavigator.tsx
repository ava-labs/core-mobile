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
import EarnSVG from 'components/svg/EarnSVG'
import { usePosthogContext } from 'contexts/PosthogContext'
import { StakeDashboard } from 'screens/earn/StakeDashboard'

export type TabNavigatorParamList = {
  [AppNavigation.Tabs.Portfolio]: { showBackButton?: boolean }
  [AppNavigation.Tabs.Watchlist]: undefined
  [AppNavigation.Tabs.Earn]: undefined
}

const Tab = createBottomTabNavigator<TabNavigatorParamList>()
const TAB_ICON_SIZE = 28

const TabNavigator = () => {
  const theme = useApplicationContext().theme
  const { earnBlocked } = usePosthogContext()

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
      {!earnBlocked && (
        <Tab.Screen
          name={AppNavigation.Tabs.Earn}
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
                routeName: AppNavigation.Tabs.Earn,
                focused,
                image: <EarnSVG selected={focused} size={TAB_ICON_SIZE} />
              })
          }}
          component={StakeDashboard}
        />
      )}
    </Tab.Navigator>
  )
}

export default TabNavigator
