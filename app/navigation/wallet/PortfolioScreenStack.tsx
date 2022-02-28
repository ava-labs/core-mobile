import React from 'react';
import AppNavigation from 'navigation/AppNavigation';
import PortfolioView from 'screens/portfolio/PortfolioView';
import {createStackNavigator} from '@react-navigation/stack';

export type PortfolioStackParamList = {
  [AppNavigation.Wallet.Drawer]: undefined;
  [AppNavigation.Wallet.TokenManagement]: undefined;
  [AppNavigation.Tabs.Watchlist]: undefined;
  Send: undefined;
  Receive: undefined;
  [AppNavigation.Wallet.ReceiveTokens]: undefined;
};

const PortfolioStack = createStackNavigator<PortfolioStackParamList>();

function PortfolioScreenStack() {
  return (
    <PortfolioStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <PortfolioStack.Screen
        name={AppNavigation.Wallet.Drawer}
        component={PortfolioView}
      />
    </PortfolioStack.Navigator>
  );
}

export default React.memo(PortfolioScreenStack);
