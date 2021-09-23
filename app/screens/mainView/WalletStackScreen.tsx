import React, {useContext} from 'react';
import {BackHandler, StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer, useFocusEffect} from '@react-navigation/native';
import EarnView from 'screens/earn/EarnView';
import AssetsView from 'screens/portfolio/AssetsView';
import {ApplicationContext} from 'contexts/ApplicationContext';
import HomeSVG from 'components/svg/HomeSVG';
import ActivitySVG from 'components/svg/ActivitySVG';
import SwapSVG from 'components/svg/SwapSVG';
import MoreSVG from 'components/svg/MoreSVG';
import {createStackNavigator} from '@react-navigation/stack';
import SendReceiveBottomSheet from 'screens/portfolio/SendReceiveBottomSheet';
import AccountBottomSheet from 'screens/portfolio/account/AccountBottomSheet';
import SwapView from 'screens/swap/SwapView';
import AppNavigation from 'navigation/AppNavigation';
import PortfolioStackScreen from 'navigation/PortfolioStackScreen';

export type BaseStackParamList = {
  Portfolio: undefined;
  Search: undefined;
  BottomSheet: undefined;
};

type Props = {
  onExit: () => void;
  onSwitchWallet: () => void;
};

const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();
const DrawerStack = createStackNavigator();

export default function WalletStackScreen(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        onExit();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []),
  );

  const onExit = (): void => {
    props.onExit();
  };

  const onSwitchWallet = (): void => {
    props.onSwitchWallet();
  };

  // function PortfolioStack({navigation, route}: any) {
  //   useEffect(() => {
  //     navigation.setOptions({tabBarVisible: setTabBarVisibility(route)});
  //   }, [navigation, route]);
  //   return (
  //     <BaseStack.Navigator
  //       initialRouteName="Portfolio"
  //       headerMode="none"
  //       detachInactiveScreens={false}
  //       screenOptions={{
  //         headerShown: false,
  //       }}>
  //       <BaseStack.Screen name="Portfolio">
  //         {() => (
  //           <PortfolioView onExit={onExit} onSwitchWallet={onSwitchWallet} />
  //         )}
  //       </BaseStack.Screen>
  //       <BaseStack.Screen
  //         name="Search"
  //         options={{cardStyleInterpolator: forFade}}>
  //         {() => <SearchView />}
  //       </BaseStack.Screen>
  //     </BaseStack.Navigator>
  //   );
  // }

  const DrawerScreen = () => (
    <DrawerStack.Navigator screenOptions={{headerShown: false}}>
      <DrawerStack.Screen
        name={AppNavigation.Tabs.Tabs}
        options={{headerShown: false}}
        component={Tabs}
      />
    </DrawerStack.Navigator>
  );

  const PortfolioStackScreenWithProps = () => {
    return (
      <PortfolioStackScreen onExit={onExit} onSwitchWallet={onSwitchWallet} />
    );
  };

  const Tabs = () => {
    const theme = useContext(ApplicationContext).theme;
    return (
      <Tab.Navigator
        sceneContainerStyle={styles.navContainer}
        screenOptions={({route}) => ({
          headerShown: false,
          tabBarIcon: ({focused}) => {
            switch (route.name) {
              case AppNavigation.Tabs.Portfolio:
                return <HomeSVG selected={focused} />;
              case AppNavigation.Tabs.Activity:
                return <ActivitySVG selected={focused} />;
              case AppNavigation.Tabs.Swap:
                return <SwapSVG selected={focused} />;
              case AppNavigation.Tabs.More:
                return <MoreSVG selected={focused} />;
            }
          },
          tabBarAllowFontScaling: false,
          tabBarActiveTintColor: theme.accentColor,
          tabBarInactiveTintColor: theme.onBgSearch,
        })}>
        <Tab.Screen
          name={AppNavigation.Tabs.Portfolio}
          component={PortfolioStackScreenWithProps}
        />
        <Tab.Screen name={AppNavigation.Tabs.Activity} component={AssetsView} />
        <Tab.Screen name={AppNavigation.Tabs.Swap} component={SwapView} />
        <Tab.Screen name={AppNavigation.Tabs.More} component={EarnView} />
      </Tab.Navigator>
    );
  };

  return (
    <NavigationContainer theme={context.navContainerTheme} independent={true}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        <RootStack.Group>
          <RootStack.Screen name={'Drawer'} component={DrawerScreen} />
        </RootStack.Group>
        <RootStack.Group screenOptions={{presentation: 'transparentModal'}}>
          <RootStack.Screen
            name={AppNavigation.Modal.SendReceiveBottomSheet}
            component={SendReceiveBottomSheet}
          />
          <RootStack.Screen
            name={AppNavigation.Modal.AccountBottomSheet}
            component={AccountBottomSheet}
          />
        </RootStack.Group>
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  navContainer: {
    backgroundColor: 'transparent',
  },
});
