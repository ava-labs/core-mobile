/* eslint-disable react/no-unstable-nested-components */
import AppNavigation from 'navigation/AppNavigation'
import HomeSVG from 'components/svg/HomeSVG'
import SwapSVG from 'components/svg/SwapSVG'
import WatchlistSVG from 'components/svg/WatchlistSVG'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useApplicationContext } from 'contexts/ApplicationContext'
import PortfolioStackScreen from 'navigation/wallet/PortfolioScreenStack'
import React, { FC, useMemo, useRef } from 'react'
import ActivityList from 'screens/shared/ActivityList/ActivityList'
import { View } from 'react-native'
import AddSVG from 'components/svg/AddSVG'
import AvaText from 'components/AvaText'
import ArrowSVG from 'components/svg/ArrowSVG'
import { useNavigation } from '@react-navigation/native'
import FloatingActionButton from 'components/FloatingActionButton'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import HistorySVG from 'components/svg/HistorySVG'
import BridgeSVG from 'components/svg/BridgeSVG'
import { Space } from 'components/Space'
import ActionButtonItem from 'components/ActionButtonItem'
import QRCodeSVG from 'components/svg/QRCodeSVG'
import {
  BridgeTransactionStatusParams,
  TabsScreenProps
} from 'navigation/types'
import WatchlistTab from 'screens/watchlist/WatchlistTabView'
import BuySVG from 'components/svg/BuySVG'
import TopNavigationHeader from 'navigation/TopNavigationHeader'
import { Transaction } from 'store/transaction'
import { showSnackBarCustom } from 'components/Snackbar'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import GeneralToast from 'components/toast/GeneralToast'
import WalletConnectSVG from 'components/svg/WalletConnectSVG'
import AvaButton from 'components/AvaButton'
import { Row } from 'components/Row'
import { getCommonBottomTabOptions, normalTabButton } from 'navigation/NavUtils'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { usePostCapture } from 'hooks/usePosthogCapture'

export type TabNavigatorParamList = {
  [AppNavigation.Tabs.Portfolio]: { showBackButton?: boolean }
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
  const { capture } = usePostCapture()
  const isBridgeDisabled = useIsUIDisabled(UI.Bridge)
  const activeNetwork = useSelector(selectActiveNetwork)

  /**
   * Due to the use of a custom FAB as a tab icon, spacing needed to be manually manipulated
   * which required the "normal" items to be manually rendered on `options.tabBarIcon` instead of automatically handled
   * by Tab.Navigator.
   */
  return (
    <Tab.Navigator
      screenOptions={{
        ...getCommonBottomTabOptions(theme),
        header: () => <TopNavigationHeader activeNetwork={activeNetwork} />
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
                activeNetwork={activeNetwork}
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
        name={AppNavigation.Tabs.Activity}
        component={Activities}
        options={{
          tabBarIcon: ({ focused }) =>
            normalTabButton({
              theme,
              routeName: AppNavigation.Tabs.Activity,
              focused,
              image: <HistorySVG selected={focused} size={TAB_ICON_SIZE} />
            })
        }}
        listeners={() => ({
          tabPress: () => {
            capture('PortfolioActivityClicked')
          }
        })}
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
            normalTabButton({
              theme,
              routeName: AppNavigation.Tabs.Watchlist,
              focused,
              image: <WatchlistSVG selected={focused} size={TAB_ICON_SIZE} />
            })
        }}
        component={WatchlistTab}
      />
      <Tab.Screen
        name={AppNavigation.Tabs.Bridge}
        component={DummyBridge}
        options={{
          tabBarIcon: ({ focused }) =>
            normalTabButton({
              theme,
              routeName: AppNavigation.Tabs.Bridge,
              focused,
              image: <BridgeSVG selected={focused} />
            })
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault()
            isBridgeDisabled
              ? showSnackBarCustom({
                  component: (
                    <GeneralToast
                      message={`Bridge not available on ${activeNetwork.chainName}`}
                    />
                  ),
                  duration: 'short'
                })
              : navigation.navigate(AppNavigation.Wallet.Bridge)
          }
        })}
      />
    </Tab.Navigator>
  )
}

type FabNavigationProp = TabsScreenProps<
  typeof AppNavigation.Tabs.Fab
>['navigation']

export type ActionProp = {
  image: React.ReactNode
  onPress: () => void
}

/**
 * extracts creation of "custom" tab item
 * @param children
 * @constructor
 */
const CustomTabBarFab: FC = ({ children }) => {
  const swapDisabled = useIsUIDisabled(UI.Swap)
  const buyDisabled = useIsUIDisabled(UI.Buy)
  const wcDisabled = useIsUIDisabled(UI.WalletConnect)
  const { theme } = useApplicationContext()
  const navigation = useNavigation<FabNavigationProp>()
  const fabRef = useRef<typeof FloatingActionButton>()
  const { setPendingDeepLink } = useDeeplink()

  const actionItems = useMemo(() => {
    const actions: Record<string, ActionProp> = {}
    // @ts-ignore
    actions.Send = {
      image: (
        <View
          testID="tab_navigator__send_button"
          style={{
            width: 24,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <ArrowSVG rotate={180} color={theme.background} size={17} />
        </View>
      ),
      onPress: () => navigation.navigate(AppNavigation.Wallet.SendTokens)
    } as ActionProp

    // @ts-ignore
    actions.Receive = {
      image: <QRCodeSVG color={theme.background} size={24} />,
      onPress: () => navigation.navigate(AppNavigation.Wallet.ReceiveTokens)
    } as ActionProp

    if (!buyDisabled) {
      // @ts-ignore
      actions.Buy = {
        image: <BuySVG color={theme.background} size={24} />,
        onPress: () => navigation.navigate(AppNavigation.Wallet.Buy)
      } as ActionProp
    }

    if (!swapDisabled) {
      // @ts-ignore
      actions.Swap = {
        image: <SwapSVG color={theme.background} size={24} />,
        onPress: () => navigation.navigate(AppNavigation.Wallet.Swap)
      } as ActionProp
    }

    if (!wcDisabled) {
      actions.WalletConnect = {
        image: <WalletConnectSVG color={theme.background} size={24} />,
        onPress: () =>
          navigation.navigate(AppNavigation.Wallet.QRCode, {
            onScanned: uri => {
              setPendingDeepLink({
                url: uri,
                origin: DeepLinkOrigin.ORIGIN_QR_CODE
              })
              navigation.goBack()
            }
          })
      } as ActionProp
    }

    return actions
  }, [
    setPendingDeepLink,
    wcDisabled,
    buyDisabled,
    swapDisabled,
    navigation,
    theme.background
  ])

  const renderItems = () => {
    return Object.entries(actionItems).map(([key, value], index) => {
      return (
        <ActionButtonItem
          key={`item-${index}`}
          buttonColor={theme.alternateBackground}
          title={key}
          onPress={value.onPress}>
          {value.image}
        </ActionButtonItem>
      )
    })
  }

  const renderList = () => {
    return Object.entries(actionItems).map(([key, value], index) => {
      return (
        <AvaButton.Base
          key={`item-${index}`}
          onPress={() => {
            // @ts-ignore type error todo:tech debt
            fabRef?.current?.collapse()
            value.onPress()
          }}>
          <Row>
            {value.image}
            <Space x={20} />
            <AvaText.ButtonLarge color={theme.background}>
              {key}
            </AvaText.ButtonLarge>
          </Row>
        </AvaButton.Base>
      )
    })
  }

  const showFanItems = Object.values(actionItems).length < 4

  return (
    <>
      {/* necessary for spacing between the fab and bottom bar buttons */}
      <Space x={48} />
      <FloatingActionButton
        ref={fabRef}
        backgroundColor={theme.colorIcon1}
        changeBackgroundColor={theme.colorIcon1}
        radius={110}
        size={56}
        changeIconTextColor={theme.colorBg2}
        icon={children}
        iconTextColor={theme.colorBg2}>
        {showFanItems ? (
          <>
            {/* invisible button item to make our buttons match the design */}
            <ActionButtonItem />
            {renderItems()}
            {/* invisible button item to make our buttons match the design */}
            <ActionButtonItem />
          </>
        ) : (
          <ActionButtonItem vertical selfContained>
            <>{renderList()}</>
          </ActionButtonItem>
        )}
      </FloatingActionButton>
    </>
  )
}

type ActivitiesNavigationProp = TabsScreenProps<
  typeof AppNavigation.Tabs.Activity
>['navigation']

const Activities = () => {
  const { navigate } = useNavigation<ActivitiesNavigationProp>()

  const openTransactionDetails = (item: Transaction) => {
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
