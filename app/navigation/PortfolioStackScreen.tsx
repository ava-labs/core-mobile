import {createStackNavigator} from '@react-navigation/stack';
import PortfolioView from 'screens/portfolio/PortfolioView';
import SearchView from 'screens/portfolio/SearchView';
import React from 'react';
import AppNavigation from 'navigation/AppNavigation';

type Props = {
  onExit: () => void;
  onSwitchWallet: () => void;
};

const forFade = ({current}: any) => ({
  cardStyle: {
    opacity: current.progress,
  },
});

export type PortfolioStackParamList = {
  PortfolioScreen: undefined;
  SearchScreen: undefined;
  SendReceiveBottomSheet: undefined | {symbol: string};
  AccountBottomSheet: undefined;
};

const PortfolioStack = createStackNavigator<PortfolioStackParamList>();

function PortfolioStackScreen({onExit, onSwitchWallet}: Props) {
  // useEffect(() => {
  //   navigation.setOptions({tabBarVisible: setTabBarVisibility(route)});
  // }, [navigation, route]);

  const PortfolioViewWithProps = () => (
    <PortfolioView onExit={onExit} onSwitchWallet={onSwitchWallet} />
  );

  return (
    <PortfolioStack.Navigator
      initialRouteName={AppNavigation.Wallet.PortfolioScreen}
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
      }}>
      <PortfolioStack.Screen
        name={AppNavigation.Wallet.PortfolioScreen}
        component={PortfolioViewWithProps}
      />
      <PortfolioStack.Screen
        name={AppNavigation.Wallet.SearchScreen}
        options={{cardStyleInterpolator: forFade}}>
        {SearchView}
      </PortfolioStack.Screen>
    </PortfolioStack.Navigator>
  );
}

export default PortfolioStackScreen;
