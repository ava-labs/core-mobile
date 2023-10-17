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
import { useIsAvalancheNetwork } from 'hooks/useIsAvalancheNetwork'
import { useIsEarnDashboardEnabled } from 'hooks/earn/useIsEarnDashboardEnabled'
import { usePostCapture } from 'hooks/usePosthogCapture'
import BrowserSVG from 'components/svg/BrowserSVG'
import BrowserScreenStack from 'navigation/wallet/BrowserScreenStack'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectHasBeenViewedOnce,
  setViewOnce,
  ViewOnceKey
} from 'store/viewOnce'
import EarnScreenStack from './EarnScreenStack/EarnScreenStack'

export type TabNavigatorParamList = {
  [AppNavigation.Tabs.Portfolio]: { showBackButton?: boolean }
  [AppNavigation.Tabs.Watchlist]: undefined
  [AppNavigation.Tabs.Stake]: undefined
  [AppNavigation.Tabs.Browser]: undefined
}

const Tab = createBottomTabNavigator<TabNavigatorParamList>()
const TAB_ICON_SIZE = 28

const TabNavigator: () => JSX.Element = () => {
  const theme = useApplicationContext().theme
  const { earnBlocked, browserBlocked } = usePosthogContext()
  const { isEarnDashboardEnabled } = useIsEarnDashboardEnabled()
  const isAvalancheNetwork = useIsAvalancheNetwork()
  const { capture } = usePostCapture()
  const dispatch = useDispatch()
  const hasBeenViewedBrowser = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.BROWSER_INTERACTION)
  )

  const renderEarnTab: () => null | JSX.Element = () => {
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
            if (!isAvalancheNetwork) {
              e.preventDefault()
              navigation.navigate(AppNavigation.Wallet.Earn, {
                screen: AppNavigation.Earn.WrongNetwork
              })
              return
            }

            capture('StakeOpened')
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

  function renderBrowserTab(): JSX.Element | null {
    if (browserBlocked) {
      return null
    }
    return (
      <Tab.Screen
        name={AppNavigation.Tabs.Browser}
        options={{
          header: () => {
            return (
              <TopNavigationHeader
                showMenu={false}
                showBackButton={false}
                showAccountSelector={true}
                showNetworkSelector={false}
              />
            )
          },
          tabBarIcon: ({ focused }) =>
            normalTabButton({
              theme,
              routeName: AppNavigation.Tabs.Browser,
              focused,
              image: <BrowserSVG selected={focused} size={TAB_ICON_SIZE} />
            })
        }}
        component={BrowserScreenStack}
        listeners={({ navigation }) => ({
          tabPress: _ => {
            if (!hasBeenViewedBrowser) {
              dispatch(setViewOnce(ViewOnceKey.BROWSER_INTERACTION))
              navigation.navigate(AppNavigation.Tabs.Browser, {
                screen: AppNavigation.Browser.Intro
              })
            } else {
              navigation.navigate(AppNavigation.Tabs.Browser, {
                screen: AppNavigation.Browser.TabView
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
      {renderBrowserTab()}
    </Tab.Navigator>
  )
}

export default TabNavigator
