import React from 'react';
import AppNavigation from 'navigation/AppNavigation';
import PortfolioView from 'screens/portfolio/PortfolioView';
import {createStackNavigator} from '@react-navigation/stack';

type Props = {
  onExit: () => void;
  onSwitchWallet: () => void;
};

export type PortfolioStackParamList = {
  [AppNavigation.Wallet.Drawer]: undefined;
  [AppNavigation.Wallet.TokenManagement]: undefined;
  [AppNavigation.Tabs.Watchlist]: undefined;
  Send: undefined;
  Receive: undefined;
  [AppNavigation.Wallet.ReceiveTokens]: undefined;
};

const PortfolioStack = createStackNavigator<PortfolioStackParamList>();

function PortfolioScreenStack({onExit, onSwitchWallet}: Props) {
  const PortfolioViewScreen = () => (
    <PortfolioView onExit={onExit} onSwitchWallet={onSwitchWallet} />
  );

  return (
    <PortfolioStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <PortfolioStack.Screen
        name={AppNavigation.Wallet.Drawer}
        component={PortfolioViewScreen}
      />
    </PortfolioStack.Navigator>
  );
}

export default React.memo(PortfolioScreenStack);
