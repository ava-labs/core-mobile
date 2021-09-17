import React, {useContext, useEffect} from 'react';
import {BackHandler, StyleSheet, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  getFocusedRouteNameFromRoute,
  NavigationContainer,
  useFocusEffect,
} from '@react-navigation/native';
import PortfolioView from 'screens/portfolio/PortfolioView';
import EarnView from 'screens/earn/EarnView';
import AssetsView from 'screens/portfolio/AssetsView';
import {ApplicationContext} from 'contexts/ApplicationContext';
import HomeSVG from 'components/svg/HomeSVG';
import ActivitySVG from 'components/svg/ActivitySVG';
import SwapSVG from 'components/svg/SwapSVG';
import MoreSVG from 'components/svg/MoreSVG';
import {createStackNavigator} from '@react-navigation/stack';
import SearchView from 'screens/portfolio/SearchView';
import SendReceiveBottomSheet from 'screens/portfolio/SendReceiveBottomSheet';
import AccountBottomSheet from 'screens/portfolio/account/AccountBottomSheet';
import SwapView from 'screens/swap/SwapView';

export type BaseStackParamList = {
  Portfolio: undefined;
  Search: undefined;
  BottomSheet: undefined;
};
const BaseStack = createStackNavigator<BaseStackParamList>();

type Props = {
  onExit: () => void;
  onSwitchWallet: () => void;
};

const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();

export default function MainView(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const theme = context.theme;

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

  const forFade = ({current}: any) => ({
    cardStyle: {
      opacity: current.progress,
    },
  });

  const tabBarScreenOptions = (params: any): any => {
    return {
      tabBarIcon: ({focused}: {focused: boolean}) => {
        if (params.route.name === 'Portfolio') {
          return <HomeSVG selected={focused} />;
        } else if (params.route.name === 'Activity') {
          return <ActivitySVG selected={focused} />;
        } else if (params.route.name === 'Swap') {
          return <SwapSVG selected={focused} />;
        } else if (params.route.name === 'More') {
          return <MoreSVG selected={focused} />;
        }
      },
    };
  };

  function setTabBarVisibility(route: any) {
    const routeName = getFocusedRouteNameFromRoute(route);
    return routeName !== 'Search';
  }

  function PortfolioStack({navigation, route}: any) {
    useEffect(() => {
      navigation.setOptions({tabBarVisible: setTabBarVisibility(route)});
    }, [navigation, route]);
    return (
      <BaseStack.Navigator
        initialRouteName="Portfolio"
        headerMode="none"
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
        }}>
        <BaseStack.Screen name="Portfolio">
          {() => (
            <PortfolioView onExit={onExit} onSwitchWallet={onSwitchWallet} />
          )}
        </BaseStack.Screen>
        <BaseStack.Screen
          name="Search"
          options={{cardStyleInterpolator: forFade}}>
          {() => <SearchView />}
        </BaseStack.Screen>
      </BaseStack.Navigator>
    );
  }

  const Assets = () => <AssetsView />;
  const Swap = () => <SwapView />;
  const Earn = () => <EarnView />;
  const Tabs = () => (
    <Tab.Navigator
      sceneContainerStyle={styles.navContainer}
      screenOptions={props => tabBarScreenOptions(props)}
      tabBarOptions={{
        allowFontScaling: false,
        activeBackgroundColor: theme.bgApp,
        inactiveBackgroundColor: theme.bgApp,
        activeTintColor: theme.accentColor,
        inactiveTintColor: theme.onBgSearch,
      }}>
      <Tab.Screen name="Portfolio" component={PortfolioStack} />
      <Tab.Screen name="Activity" component={Assets} />
      <Tab.Screen name="Swap" component={Swap} />
      <Tab.Screen name="More" component={Earn} />
    </Tab.Navigator>
  );

  const Modals = () => {
    return (
      <>
        <RootStack.Screen
          name="SendReceiveBottomSheet"
          component={SendReceiveBottomSheet}
        />
        <RootStack.Screen
          name={'AccountBottomSheet'}
          component={AccountBottomSheet}
        />
      </>
    );
  };

  function loadWalletNavigation() {
    return (
      <NavigationContainer theme={context.navContainerTheme} independent={true}>
        <RootStack.Navigator
          mode="modal"
          headerMode="none"
          screenOptions={{
            headerShown: false,
            cardStyle: {backgroundColor: 'transparent'},
            cardOverlayEnabled: true,
            cardStyleInterpolator: ({current: {progress}}) => ({
              overlayStyle: {
                opacity: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                  extrapolate: 'clamp',
                }),
              },
            }),
          }}>
          <RootStack.Screen name="Main" component={Tabs} />
          {Modals()}
        </RootStack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.container}>{loadWalletNavigation()}</View>
    </View>
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
