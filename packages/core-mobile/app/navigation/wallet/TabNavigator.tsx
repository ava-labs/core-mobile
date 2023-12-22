/* eslint-disable react/no-unstable-nested-components */
import AppNavigation from 'navigation/AppNavigation'
import HomeSVG from 'components/svg/HomeSVG'
import WatchlistSVG from 'components/svg/WatchlistSVG'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useApplicationContext } from 'contexts/ApplicationContext'
import PortfolioStackScreen from 'navigation/wallet/PortfolioScreenStack'
import React, { useState } from 'react'
import WatchlistTab from 'screens/watchlist/WatchlistTabView'
import TopNavigationHeader from 'navigation/TopNavigationHeader'
import { getCommonBottomTabOptions, TabButton } from 'navigation/NavUtils'
import EarnSVG from 'components/svg/EarnSVG'
import { usePosthogContext } from 'contexts/PosthogContext'
import { useIsAvalancheNetwork } from 'hooks/useIsAvalancheNetwork'
import { useIsEarnDashboardEnabled } from 'hooks/earn/useIsEarnDashboardEnabled'
import BrowserSVG from 'components/svg/BrowserSVG'
import BrowserScreenStack from 'navigation/wallet/BrowserScreenStack'
import { useAnalytics } from 'hooks/useAnalytics'
import { Fab } from 'components/Fab'
import { selectAllTabs } from 'store/browser'
import { useSelector } from 'react-redux'
import EarnScreenStack from './EarnScreenStack/EarnScreenStack'

export type TabNavigatorParamList = {
  [AppNavigation.Tabs.Portfolio]: { showBackButton?: boolean }
  [AppNavigation.Tabs.Watchlist]: undefined
  [AppNavigation.Tabs.Stake]: undefined
  [AppNavigation.Tabs.Browser]: undefined
  [AppNavigation.Tabs.Fab]: undefined
}

const Tab = createBottomTabNavigator<TabNavigatorParamList>()
const TAB_ICON_SIZE = 28

const TabNavigator: () => JSX.Element = () => {
  const theme = useApplicationContext().theme
  const { earnBlocked, browserBlocked } = usePosthogContext()
  const { isEarnDashboardEnabled } = useIsEarnDashboardEnabled()
  const isAvalancheNetwork = useIsAvalancheNetwork()
  const { capture } = useAnalytics()
  const [showFab, setShowFab] = useState(true)
  const allTabs = useSelector(selectAllTabs)

  const renderEarnTab: () => null | JSX.Element = () => {
    if (earnBlocked) return null
    return (
      <Tab.Screen
        name={AppNavigation.Tabs.Stake}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabButton
              routeName={AppNavigation.Tabs.Stake}
              focused={focused}
              image={<EarnSVG selected={focused} size={TAB_ICON_SIZE} />}
            />
          )
        }}
        component={EarnScreenStack}
        listeners={({ navigation }) => ({
          focus: () => {
            setShowFab(true)
          },
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
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabButton
              routeName={AppNavigation.Tabs.Browser}
              focused={focused}
              image={<BrowserSVG selected={focused} size={TAB_ICON_SIZE} />}
            />
          )
        }}
        listeners={() => ({
          focus: () => {
            setShowFab(false)
          },
          tabPress: () => {
            capture('BrowserOpened', { openTabs: allTabs.length })
          }
        })}
        component={BrowserScreenStack}
      />
    )
  }

  return (
    <>
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
            tabBarIcon: ({ focused }) => (
              <TabButton
                routeName={AppNavigation.Tabs.Portfolio}
                focused={focused}
                image={<HomeSVG selected={focused} size={TAB_ICON_SIZE} />}
              />
            )
          })}
          listeners={() => ({
            focus: () => {
              setShowFab(true)
            }
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
            tabBarIcon: ({ focused }) => (
              <TabButton
                routeName={AppNavigation.Tabs.Watchlist}
                focused={focused}
                image={<WatchlistSVG selected={focused} size={TAB_ICON_SIZE} />}
              />
            )
          }}
          listeners={() => ({
            focus: () => {
              setShowFab(true)
            }
          })}
          component={WatchlistTab}
        />
        {renderEarnTab()}
        {renderBrowserTab()}
      </Tab.Navigator>
      {showFab && <Fab />}
    </>
  )
}

export default TabNavigator
