import AppNavigation from 'navigation/AppNavigation'
import HomeSVG from 'components/svg/HomeSVG'
import SwapSVG from 'components/svg/SwapSVG'
import WatchlistSVG from 'components/svg/WatchlistSVG'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import {
  TransactionNormal,
  TransactionERC20
} from '@avalabs/wallet-react-components'
import { useApplicationContext } from 'contexts/ApplicationContext'
import PortfolioStackScreen from 'navigation/wallet/PortfolioScreenStack'
import React, { FC } from 'react'
import ActivityList from 'screens/shared/ActivityList'
import { View } from 'react-native'
import AddSVG from 'components/svg/AddSVG'
import AvaText from 'components/AvaText'
import ArrowSVG from 'components/svg/ArrowSVG'
import { useNavigation } from '@react-navigation/native'
import FloatingActionButton from 'components/FloatingActionButton'
import useInAppBrowser from 'hooks/useInAppBrowser'
import { useIsUIDisabled, UI } from 'hooks/useIsUIDisabled'
import HistorySVG from 'components/svg/HistorySVG'
import BridgeSVG from 'components/svg/BridgeSVG'
import { Space } from 'components/Space'
import ActionButtonItem from 'components/ActionButtonItem'
import QRCodeSVG from 'components/svg/QRCodeSVG'
import { TabsScreenProps } from 'navigation/types'
import WatchlistTab from 'screens/watchlist/WatchlistTabView'
import BuySVG from 'components/svg/BuySVG'
import { BridgeTransactionStatusParams } from 'navigation/types'

export type TabNavigatorParamList = {
  [AppNavigation.Tabs.Portfolio]: undefined
  [AppNavigation.Tabs.Activity]: undefined
  [AppNavigation.Tabs.Fab]: undefined
  [AppNavigation.Tabs.Watchlist]: undefined
  [AppNavigation.Tabs.Bridge]: undefined
}

const Tab = createBottomTabNavigator<TabNavigatorParamList>()
const TAB_ICON_SIZE = 28

const DummyBridge = () => (
  <View style={{ flex: 1, backgroundColor: 'transparent' }} />
)

const TabNavigator = () => {
  const theme = useApplicationContext().theme

  /**
   * extracts creation of "normal" tab items
   * @param routeName
   * @param focused
   * @param image
   */
  function normalTabButtons(
    routeName: string,
    focused: boolean,
    image: React.ReactNode
  ) {
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center', top: 2 }}>
        {image}
        <AvaText.Caption
          textStyle={{
            color: focused ? theme.alternateBackground : theme.colorIcon4
          }}>
          {routeName}
        </AvaText.Caption>
      </View>
    )
  }

  /**
   * Due to the use of a custom FAB as a tab icon, spacing needed to be manually manipulated
   * which required the "normal" items to be manually rendered on `options.tabBarIcon` instead of automatically handled
   * by Tab.Navigator.
   */
  return (
    <Tab.Navigator
      screenOptions={() => ({
        tabBarShowLabel: false,
        headerShown: false,
        tabBarAllowFontScaling: false,
        tabBarActiveTintColor: theme.colorPrimary1,
        tabBarInactiveTintColor: theme.colorText2,
        tabBarStyle: {
          backgroundColor: theme.background
        }
      })}>
      <Tab.Screen
        name={AppNavigation.Tabs.Portfolio}
        component={PortfolioStackScreen}
        options={{
          tabBarIcon: ({ focused }) =>
            normalTabButtons(
              AppNavigation.Tabs.Portfolio,
              focused,
              <HomeSVG selected={focused} size={TAB_ICON_SIZE} />
            )
        }}
      />
      <Tab.Screen
        name={AppNavigation.Tabs.Activity}
        component={Activities}
        options={{
          tabBarIcon: ({ focused }) =>
            normalTabButtons(
              AppNavigation.Tabs.Activity,
              focused,
              <HistorySVG selected={focused} size={TAB_ICON_SIZE} />
            )
        }}
      />
      <Tab.Screen
        name={AppNavigation.Tabs.Fab}
        component={CustomTabBarFab}
        options={{
          tabBarIcon: () => (
            <AddSVG color={theme.colorBg2} size={TAB_ICON_SIZE} hideCircle />
          ),
          tabBarButton: props => <CustomTabBarFab children={props.children} />
        }}
      />
      <Tab.Screen
        name={AppNavigation.Tabs.Watchlist}
        options={{
          tabBarIcon: ({ focused }) =>
            normalTabButtons(
              AppNavigation.Tabs.Watchlist,
              focused,
              <WatchlistSVG selected={focused} size={TAB_ICON_SIZE} />
            )
        }}
        component={WatchlistTab}
      />
      <Tab.Screen
        name={AppNavigation.Tabs.Bridge}
        component={DummyBridge}
        options={{
          tabBarIcon: ({ focused }) =>
            normalTabButtons(
              AppNavigation.Tabs.Bridge,
              focused,
              <BridgeSVG selected={focused} />
            )
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault()
            navigation.navigate(AppNavigation.Wallet.Bridge)
          }
        })}
      />
    </Tab.Navigator>
  )
}

type FabNavigationProp = TabsScreenProps<
  typeof AppNavigation.Tabs.Fab
>['navigation']

/**
 * extracts creation of "custom" tab item
 * @param children
 * @constructor
 */
const CustomTabBarFab: FC = ({ children }) => {
  const swapDisabled = useIsUIDisabled(UI.Swap)
  const buyDisabled = useIsUIDisabled(UI.Buy)
  const { theme } = useApplicationContext()
  const { openMoonPay } = useInAppBrowser()
  const navigation = useNavigation<FabNavigationProp>()

  const renderBuyBtn = () => (
    <ActionButtonItem
      buttonColor={theme.alternateBackground}
      title="Buy"
      onPress={() => {
        console.log('pressed on buy')
        openMoonPay()
      }}>
      <BuySVG color={theme.background} />
    </ActionButtonItem>
  )

  const renderSendBtn = () => (
    <ActionButtonItem
      buttonColor={theme.alternateBackground}
      title="Send"
      onPress={() => navigation.navigate(AppNavigation.Wallet.SendTokens)}>
      <ArrowSVG rotate={225} color={theme.background} size={20} />
    </ActionButtonItem>
  )

  const renderReceiveBtn = () => (
    <ActionButtonItem
      buttonColor={theme.alternateBackground}
      title="Receive"
      onPress={() => {
        navigation.navigate(AppNavigation.Wallet.ReceiveTokens)
      }}>
      <QRCodeSVG color={theme.background} size={24} />
    </ActionButtonItem>
  )

  const renderSwapBtn = () => (
    <ActionButtonItem
      buttonColor={theme.alternateBackground}
      title="Swap"
      onPress={() => navigation.navigate(AppNavigation.Wallet.Swap)}>
      <SwapSVG color={theme.background} size={24} />
    </ActionButtonItem>
  )
  return (
    <>
      {/* necessary for spacing between the fab and bottom bar buttons */}
      <Space x={48} />
      <FloatingActionButton
        backgroundColor={theme.colorIcon1}
        changeBackgroundColor={theme.colorIcon1}
        radius={110}
        size={56}
        changeIconTextColor={theme.colorBg2}
        icon={children}
        iconTextColor={theme.colorBg2}>
        {/* invisible button item to make our buttons match the design */}
        <ActionButtonItem />
        {!buyDisabled && renderBuyBtn()}
        {renderSendBtn()}
        {renderReceiveBtn()}
        {!swapDisabled && renderSwapBtn()}
        {/* invisible button item to make our buttons match the design */}
        <ActionButtonItem />
      </FloatingActionButton>
    </>
  )
}

type ActivitiesNavigationProp = TabsScreenProps<
  typeof AppNavigation.Tabs.Activity
>['navigation']

const Activities = () => {
  const { navigate } = useNavigation<ActivitiesNavigationProp>()

  const openTransactionDetails = (
    item: TransactionNormal | TransactionERC20
  ) => {
    navigate(AppNavigation.Wallet.ActivityDetail, {
      tx: item
    })
  }

  const openTransactionStatus = (params: BridgeTransactionStatusParams) => {
    navigate(AppNavigation.Bridge.BridgeTransactionStatus, params)
  }

  return (
    <ActivityList
      openTransactionDetails={openTransactionDetails}
      openTransactionStatus={openTransactionStatus}
    />
  )
}

export default React.memo(TabNavigator)
