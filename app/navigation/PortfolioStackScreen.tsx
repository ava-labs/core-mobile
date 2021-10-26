import {createStackNavigator} from '@react-navigation/stack';
import React, {useContext} from 'react';
import AppNavigation from 'navigation/AppNavigation';
import PortfolioView from 'screens/portfolio/PortfolioView';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  onExit: () => void;
  onSwitchWallet: () => void;
};

export type PortfolioStackParamList = {
  PortfolioScreen: undefined;
  SearchScreen: undefined;
  AccountBottomSheet: undefined;
};

const PortfolioStack = createStackNavigator<PortfolioStackParamList>();

function PortfolioStackScreen({onExit, onSwitchWallet}: Props) {
  const {theme} = useContext(ApplicationContext);
  const PortfolioViewWithProps = () => (
    <PortfolioView onExit={onExit} onSwitchWallet={onSwitchWallet} />
  );

  return (
    <PortfolioStack.Navigator
      initialRouteName={AppNavigation.Wallet.PortfolioScreen}
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        cardStyle: {backgroundColor: theme.colorBg1},
      }}>
      <PortfolioStack.Screen
        name={AppNavigation.Wallet.PortfolioScreen}
        component={PortfolioViewWithProps}
      />
    </PortfolioStack.Navigator>
  );
}

export default PortfolioStackScreen;
