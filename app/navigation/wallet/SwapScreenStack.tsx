import React from 'react';
import AppNavigation from 'navigation/AppNavigation';
import PortfolioView from 'screens/portfolio/PortfolioView';
import {createStackNavigator} from '@react-navigation/stack';
import SwapView from 'screens/swap/SwapView';

type Props = {
  onExit: () => void;
  onSwitchWallet: () => void;
};

const SwapStack = createStackNavigator();

function SwapScreenStack({onExit, onSwitchWallet}: Props) {
  const PortfolioViewScreen = () => (
    <PortfolioView onExit={onExit} onSwitchWallet={onSwitchWallet} />
  );

  return (
    <SwapStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <SwapStack.Screen name={AppNavigation.Wallet.Swap} component={SwapView} />
    </SwapStack.Navigator>
  );
}

export default React.memo(SwapScreenStack);
