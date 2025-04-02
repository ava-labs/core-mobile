/* eslint-disable react/no-unstable-nested-components */
import AppNavigation, { Tabs } from 'navigation/AppNavigation'
import HomeSVG from 'components/svg/HomeSVG'
import WatchlistSVG from 'components/svg/WatchlistSVG'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useApplicationContext } from 'contexts/ApplicationContext'
import PortfolioStackScreen from 'navigation/wallet/PortfolioScreenStack'
import React, { useState } from 'react'
import TopNavigationHeader from 'navigation/TopNavigationHeader'
import { getCommonBottomTabOptions, TabButton } from 'navigation/NavUtils'
import EarnSVG from 'components/svg/EarnSVG'
import { usePosthogContext } from 'contexts/PosthogContext'
import { useIsEarnDashboardEnabled } from 'hooks/earn/useIsEarnDashboardEnabled'
import BrowserSVG from 'components/svg/BrowserSVG'
import BrowserScreenStack from 'navigation/wallet/BrowserScreenStack'
import { Fab } from 'components/Fab'
import { addTab, selectActiveTab, selectAllTabs } from 'store/browser'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WatchlistScreen } from 'screens/watchlist/WatchlistScreen'
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
  const dispatch = useDispatch()
  const theme = useApplicationContext().theme
  const { earnBlocked, browserBlocked } = usePosthogContext()
  const { isEarnDashboardEnabled } = useIsEarnDashboardEnabled()
  const [showFab, setShowFab] = useState(true)
  const allTabs = useSelector(selectAllTabs)
  const activeTab = useSelector(selectActiveTab)
  const [currentTab, setCurrentTab] = useState<Tabs | null>(null)

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
            setCurrentTab(AppNavigation.Tabs.Stake)
            AnalyticsService.capture('StakeOpened')
            if (!isEarnDashboardEnabled) {
              e.preventDefault()
              // @ts-ignore
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
            if (
              activeTab?.activeHistoryIndex !== -1 &&
              currentTab === AppNavigation.Tabs.Browser
            ) {
              // if activeHistoryIndex is -1, it means the tab is empty
              // and we should not add a new tab
              dispatch(addTab())
            }
            setCurrentTab(AppNavigation.Tabs.Browser)
            AnalyticsService.capture('BrowserOpened', {
              openTabs: allTabs.length
            })
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
            },
            tabPress: () => setCurrentTab(AppNavigation.Tabs.Portfolio)
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
            },
            tabPress: () => setCurrentTab(AppNavigation.Tabs.Watchlist)
          })}
          component={WatchlistScreen}
        />
        {renderEarnTab()}
        {renderBrowserTab()}
      </Tab.Navigator>
      {showFab && <Fab />}
    </>
  )
}

export default TabNavigator
