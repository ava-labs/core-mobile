import React from 'react';
import AppNavigation from 'navigation/AppNavigation';
import PortfolioView from 'screens/portfolio/PortfolioView';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {createStackNavigator} from '@react-navigation/stack';

type Props = {
  onExit: () => void;
  onSwitchWallet: () => void;
};

export type PortfolioStackParamList = {
  [AppNavigation.Wallet.Drawer]: undefined;
};

const PortfolioStack = createStackNavigator<PortfolioStackParamList>();

function PortfolioScreenStack({onExit, onSwitchWallet}: Props) {
  const {theme} = useApplicationContext();
  const PortfolioViewScreen = () => (
    <PortfolioView onExit={onExit} onSwitchWallet={onSwitchWallet} />
  );

  return (
    <PortfolioStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: {backgroundColor: theme.colorBg1},
      }}>
      <PortfolioStack.Screen
        name={AppNavigation.Wallet.Drawer}
        component={PortfolioViewScreen}
      />
    </PortfolioStack.Navigator>
  );
}

export default React.memo(PortfolioScreenStack);
