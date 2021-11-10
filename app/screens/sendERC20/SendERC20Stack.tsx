import React, {useMemo} from 'react';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import DoneScreen from 'screens/send/DoneScreen';
import {
  createStackNavigator,
  StackNavigationOptions,
  TransitionPresets,
} from '@react-navigation/stack';
import HeaderAndTabs from 'screens/send/HeaderAndTabs';
import ConfirmScreen from 'screens/send/ConfirmScreen';
import {ERC20} from '@avalabs/wallet-react-components';
import {SendERC20ContextProvider} from 'contexts/SendERC20Context';
import {SubHeaderOptions} from 'navigation/NavUtils';

const Stack = createStackNavigator();

type Props = {
  onClose: () => void;
  token: ERC20;
};

export default function SendERC20Stack({onClose, token}: Props): JSX.Element {
  const context = useApplicationContext();
  const screenOptions = useMemo<StackNavigationOptions>(
    () => ({
      ...TransitionPresets.SlideFromRightIOS,
      headerShown: false,
      safeAreaInsets: {top: 0},
      cardStyle: {
        overflow: 'visible',
      },
    }),
    [],
  );
  const HeaderNTabs = () => <HeaderAndTabs onClose={onClose} />;
  const DoneScrn = () => <DoneScreen onClose={onClose} />;

  return (
    <SendERC20ContextProvider erc20Token={token}>
      <NavigationContainer independent={true} theme={context.navContainerTheme}>
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen
            name={AppNavigation.SendToken.SendTokenScreen}
            component={HeaderNTabs}
          />
          <Stack.Screen
            name={AppNavigation.SendToken.ConfirmTransactionScreen}
            options={SubHeaderOptions('Confirm Transaction')}
            component={ConfirmScreen} //TODO: change to specific screen for ant
          />
          <Stack.Screen
            name={AppNavigation.SendToken.DoneScreen}
            component={DoneScrn}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SendERC20ContextProvider>
  );
}
