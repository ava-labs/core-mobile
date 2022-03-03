import AppNavigation from 'navigation/AppNavigation';
import HomeSVG from 'components/svg/HomeSVG';
import SwapSVG from 'components/svg/SwapSVG';
import WatchlistSVG from 'components/svg/WatchlistSVG';
import {MainHeaderOptions} from 'navigation/NavUtils';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useApplicationContext} from 'contexts/ApplicationContext';
import PortfolioStackScreen from 'navigation/wallet/PortfolioScreenStack';
import React, {ReactElement} from 'react';
import ActivityList from 'screens/activity/ActivityList';
import {View} from 'react-native';
import AddSVG from 'components/svg/AddSVG';
import AvaText from 'components/AvaText';
import BuySVG from 'components/svg/BuySVG';
import ArrowSVG from 'components/svg/ArrowSVG';
import {useNavigation} from '@react-navigation/native';
import FloatingActionButton from 'components/FloatingActionButton';
import useInAppBrowser from 'hooks/useInAppBrowser';
import HistorySVG from 'components/svg/HistorySVG';
import BridgeSVG from 'components/svg/BridgeSVG';
import {Space} from 'components/Space';
import ActionButtonItem from 'components/ActionButtonItem';
import QRCodeSVG from 'components/svg/QRCodeSVG';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from 'navigation/WalletScreenStack';
import WatchlistTab from 'screens/watchlist/WatchlistTabView';
import Bridge from 'screens/bridge/Bridge';

const Tab = createBottomTabNavigator();
const TAB_ICON_SIZE = 28;

const TabNavigator = () => {
  const theme = useApplicationContext().theme;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {openMoonPay} = useInAppBrowser();

  /**
   * extracts creation of "normal" tab items
   * @param routeName
   * @param focused
   * @param image
   */
  function normalTabButtons(
    routeName: string,
    focused: boolean,
    image: React.ReactNode,
  ) {
    return (
      <View style={{justifyContent: 'center', alignItems: 'center', top: 2}}>
        {image}
        <AvaText.Caption
          textStyle={{
            color: focused ? theme.alternateBackground : theme.txtDim,
          }}>
          {routeName}
        </AvaText.Caption>
      </View>
    );
  }

  /**
   * extracts creation of "custom" tab item
   * @param children
   * @constructor
   */
  const CustomTabBarFab = ({children}: {children: ReactElement}) => (
    <>
      {/* necessary for spacing between the fab and bottle bar buttons */}
      <Space x={48} />
      <FloatingActionButton
        backgroundColor={'#0A84FF'}
        changeBackgroundColor={'#0A84FF'}
        radius={110}
        size={48}
        changeIconTextColor={'#000000'}
        icon={children}
        iconTextColor={'#FFFFFF'}>
        <ActionButtonItem />
        <ActionButtonItem
          buttonColor={theme.alternateBackground}
          title="Buy"
          onPress={() => openMoonPay()}>
          <BuySVG color={theme.background} size={20} />
        </ActionButtonItem>
        <ActionButtonItem
          buttonColor={theme.alternateBackground}
          title="Send"
          onPress={() => navigation.navigate(AppNavigation.Wallet.SendTokens)}>
          <ArrowSVG rotate={225} color={theme.background} size={20} />
        </ActionButtonItem>
        <ActionButtonItem
          buttonColor={theme.alternateBackground}
          title="Receive"
          onPress={() => {
            navigation.navigate(AppNavigation.Wallet.ReceiveTokens);
          }}>
          <QRCodeSVG color={theme.background} size={24} />
        </ActionButtonItem>
        <ActionButtonItem
          buttonColor={theme.alternateBackground}
          title="Swap"
          onPress={() => navigation.navigate(AppNavigation.Wallet.Swap)}>
          <SwapSVG color={theme.background} size={24} />
        </ActionButtonItem>
        <ActionButtonItem />
      </FloatingActionButton>
    </>
  );

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
        tabBarActiveTintColor: theme.accentColor,
        tabBarInactiveTintColor: theme.onBgSearch,
        tabBarStyle: {
          backgroundColor: theme.background,
        },
      })}>
      <Tab.Screen
        name={AppNavigation.Tabs.Portfolio}
        component={PortfolioStackScreen}
        options={{
          tabBarIcon: ({focused}) =>
            normalTabButtons(
              AppNavigation.Tabs.Portfolio,
              focused,
              <HomeSVG selected={focused} size={TAB_ICON_SIZE} />,
            ),
        }}
      />
      <Tab.Screen
        name={AppNavigation.Tabs.Activity}
        component={ActivityList}
        options={{
          tabBarIcon: ({focused}) =>
            normalTabButtons(
              AppNavigation.Tabs.Activity,
              focused,
              <HistorySVG selected={focused} size={TAB_ICON_SIZE} />,
            ),
        }}
      />
      <Tab.Screen
        name={AppNavigation.Tabs.Fab}
        component={CustomTabBarFab}
        options={{
          tabBarIcon: () => (
            <AddSVG color={theme.white} size={TAB_ICON_SIZE} hideCircle />
          ),
          tabBarButton: props => <CustomTabBarFab {...props} />,
        }}
      />
      <Tab.Screen
        name={AppNavigation.Tabs.Watchlist}
        options={{
          ...MainHeaderOptions('WatchList'),
          tabBarIcon: ({focused}) =>
            normalTabButtons(
              AppNavigation.Tabs.Watchlist,
              focused,
              <WatchlistSVG selected={focused} size={TAB_ICON_SIZE} />,
            ),
        }}
        component={WatchlistTab}
      />
      <Tab.Screen
        name={AppNavigation.Tabs.Bridge}
        component={Bridge}
        options={{
          ...MainHeaderOptions('Bridge'),
          tabBarIcon: ({focused}) =>
            normalTabButtons(
              AppNavigation.Tabs.Bridge,
              focused,
              <BridgeSVG selected={focused} />,
            ),
        }}
      />
    </Tab.Navigator>
  );
};

export default React.memo(TabNavigator);
