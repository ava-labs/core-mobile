import AppNavigation from 'navigation/AppNavigation';
import HomeSVG from 'components/svg/HomeSVG';
import SwapSVG from 'components/svg/SwapSVG';
import WatchlistSVG from 'components/svg/WatchlistSVG';
import WatchlistView from 'screens/watchlist/WatchlistView';
import {MainHeaderOptions} from 'navigation/NavUtils';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useApplicationContext} from 'contexts/ApplicationContext';
import PortfolioStackScreen from 'navigation/wallet/PortfolioScreenStack';
import React from 'react';
import {noop} from 'rxjs';
import ActivityView from 'screens/activity/ActivityView';
import SwapScreenStack from 'navigation/wallet/SwapScreenStack';
import SwapView from 'screens/swap/SwapView';
import {Alert, Pressable, StyleSheet, View} from 'react-native';
import AddSVG from 'components/svg/AddSVG';
import AvaText from 'components/AvaText';
import BuySVG from 'components/svg/BuySVG';
import ActionButton from 'components/ActionButton';
import ArrowSVG from 'components/svg/ArrowSVG';
import {useNavigation} from '@react-navigation/native';
import FloatingActionButton from 'components/svg/FloatingActionButton';
import useInAppBrowser from 'hooks/useInAppBrowser';
import HistorySVG from 'components/svg/HistorySVG';
import BridgeSVG from 'components/svg/BridgeSVG';

const Tab = createBottomTabNavigator();
const TAB_ICON_SIZE = 28;

const PortfolioStackScreenWithProps = () => {
  return (
    <PortfolioStackScreen onExit={() => noop()} onSwitchWallet={() => noop()} />
  );
};

const TabNavigator = () => {
  const theme = useApplicationContext().theme;
  const navigation = useNavigation();
  const {openMoonPay} = useInAppBrowser();

  function normalTabButtons(
    routeName: string,
    focused: boolean,
    image: React.ReactNode,
  ) {
    return (
      <View style={{justifyContent: 'center', alignItems: 'center', top: 2}}>
        {image}
        <AvaText.Caption
          color={focused ? theme.alternateBackground : theme.txtDim}>
          {routeName}
        </AvaText.Caption>
      </View>
    );
  }

  const CustomTabBarFab = ({children}) => (
    // <View
    //   pointerEvents={'box-none'}
    //   style={{
    //     top: -50,
    //     position: 'absolute',
    //     justifyContent: 'center',
    //     alignItems: 'center',
    //     width: '100%',
    //     backgroundColor: 'green',
    //     height: 200,
    //   }}>
    //   {/*{fabActive && (*/}
    //   {/*  <LinearGradient*/}
    //   {/*    pointerEvents={'box-none'}*/}
    //   {/*    colors={['transparent', '#000000D9', '#000000']}*/}
    //   {/*    style={{height: 400, width: '100%', flex: 1}}*/}
    //   {/*  />*/}
    //   {/*)}*/}
    <>
      <View style={{width: 48}} />
      <FloatingActionButton
        backgroundColor={'#0A84FF'}
        changeBackgroundColor={'#FFFFFF'}
        radius={110}
        size={69}
        changeIconTextColor={'#000000'}
        iconText={'+'}
        iconTextColor={'#FFFFFF'}>
        <ActionButton.Item />
        <ActionButton.Item
          buttonColor={theme.alternateBackground}
          title="Buy"
          btnOutRangeText={'#ffffff'}
          onPress={() => openMoonPay()}>
          <BuySVG color={theme.background} />
        </ActionButton.Item>
        <ActionButton.Item
          buttonColor={theme.alternateBackground}
          title="Send"
          onPress={() => navigation.navigate(AppNavigation.Wallet.SendTokens)}>
          <ArrowSVG rotate={225} color={theme.background} size={20} />
        </ActionButton.Item>
        <ActionButton.Item
          buttonColor={theme.alternateBackground}
          title="Receive"
          onPress={() => {
            navigation.navigate(AppNavigation.Wallet.ReceiveTokens);
          }}>
          <ArrowSVG rotate={45} color={theme.background} size={20} />
        </ActionButton.Item>
        <ActionButton.Item
          buttonColor={theme.alternateBackground}
          title="Swap"
          onPress={() => navigation.navigate(AppNavigation.Wallet.Swap)}>
          <SwapSVG color={theme.background} size={24} />
        </ActionButton.Item>
        <ActionButton.Item />
      </FloatingActionButton>
    </>
    // </View>

    // <Pressable
    //   style={{
    //     top: -100,
    //     position: 'absolute',
    //     justifyContent: 'center',
    //     alignItems: 'center',
    //     width: '100%',
    //     height: 200,
    //   }}
    //   onPress={() => {
    //     Alert.alert('This is being intercepted');
    //   }}>
    //   <View
    //     style={{
    //       width: 48,
    //       height: 48,
    //       borderRadius: 35,
    //       backgroundColor: '#0A84FF',
    //     }}>
    //     {children}
    //   </View>
    // </Pressable>
  );

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
        component={PortfolioStackScreenWithProps}
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
        component={ActivityView}
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
        component={WatchlistView}
      />
      <Tab.Screen
        name={AppNavigation.Tabs.Bridge}
        component={WatchlistView}
        options={{
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

const styles = StyleSheet.create({
  actionButtonIcon: {
    fontSize: 20,
    height: 22,
    color: 'white',
  },
});

export default React.memo(TabNavigator);
