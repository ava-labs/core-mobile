import {createStackNavigator} from '@react-navigation/stack';
import PortfolioView from 'screens/portfolio/PortfolioView';
import SearchView from 'screens/portfolio/SearchView';
import React, {useEffect} from 'react';
import AppNavigation from 'navigation/AppNavigation';
import {ERC20} from '@avalabs/wallet-react-components';
import {AvaxToken} from 'dto/AvaxToken';

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
  SendReceiveBottomSheet: undefined | {token: ERC20 | AvaxToken};
  AccountBottomSheet: undefined;
};

const PortfolioStack = createStackNavigator<PortfolioStackParamList>();

function PortfolioStackScreen({onExit, onSwitchWallet}: Props) {
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
    </PortfolioStack.Navigator>
  );
}

export default PortfolioStackScreen;
