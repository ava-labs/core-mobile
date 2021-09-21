/**
 * Avalanche Wallet App
 *
 * @format
 * @flow strict-local
 */

import React, {RefObject, useContext, useEffect} from 'react';
import {Alert, BackHandler} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import {
  NavigationContainer,
  NavigationContainerRef,
  StackActions,
} from '@react-navigation/native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AppViewModel, {
  ExitPromptAnswers,
  LogoutEvents,
  LogoutPromptAnswers,
  ShowExitPrompt,
  ShowLogoutPrompt,
} from 'AppViewModel';
import {
  FUJI_NETWORK,
  useNetworkContext,
} from '@avalabs/wallet-react-components';
import {AuthStackScreen} from 'navigation/AuthStackScreen';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import WalletStackScreen from 'screens/mainView/WalletStackScreen';
import {useAuthContext} from 'hooks/AuthContext';
import SendAvax from './screens/sendAvax/SendAvax';
import AvaNavigation from 'navigation/AvaNavigation';

const RootStack = createStackNavigator();
const DrawerStack = createDrawerNavigator();

const navigationRef: RefObject<NavigationContainerRef> = React.createRef();

const onOk = (value: ShowExitPrompt): void => {
  value.prompt.next(ExitPromptAnswers.Ok);
  value.prompt.complete();
};

const onNo = (value: ShowExitPrompt): void => {
  value.prompt.next(ExitPromptAnswers.Cancel);
  value.prompt.complete();
};

const onExit = (): void => {
  AppViewModel.onExit().subscribe({
    next: (value: LogoutEvents) => {
      if (value instanceof ShowExitPrompt) {
        Alert.alert(
          'Your passphrase will remain securely stored for easier later access of wallet.',
          undefined,
          [
            {
              text: 'Ok',
              onPress: () => onOk(value as ShowExitPrompt),
            },
            {
              text: 'Cancel',
              onPress: () => onNo(value as ShowExitPrompt),
              style: 'cancel',
            },
          ],
        );
      }
    },
    error: err => Alert.alert(err.message),
  });
};
//
export const onEnterWallet = (
  mnemonic: string,
  setMnemonic: (mnemonic: string) => void,
): void => {
  // AppViewModel.onEnterWallet(mnemonic).subscribe({
  //   next: () => setMnemonic(mnemonic),
  //   error: err => Alert.alert(err.message),
  // });
};

const onSavedMnemonic = (mnemonic: string): void => {
  AppViewModel.onSavedMnemonic(mnemonic);
};

const onYes = (value: ShowLogoutPrompt): void => {
  value.prompt.next(LogoutPromptAnswers.Yes);
  value.prompt.complete();
};

const onCancel = (value: ShowLogoutPrompt): void => {
  value.prompt.next(LogoutPromptAnswers.Cancel);
  value.prompt.complete();
};
//
// const onSwitchWallet = (): void => {
//   viewModel.onLogout().subscribe({
//     next: (value: LogoutEvents) => {
//       if (value instanceof ShowLogoutPrompt) {
//         Alert.alert(
//           'Do you want to delete the stored passphrase and switch accounts?',
//           undefined,
//           [
//             {
//               text: 'Cancel',
//               onPress: () => onCancel(value as ShowLogoutPrompt),
//               style: 'cancel',
//             },
//             {text: 'Yes', onPress: () => onYes(value as ShowLogoutPrompt)},
//           ],
//         );
//       }
//     },
//     error: err => Alert.alert(err.message),
//   });
// };

const DrawerScreen = () => (
  <DrawerStack.Navigator headerMode="none">
    <DrawerStack.Screen
      name={AvaNavigation.Stack.Wallet}
      options={{headerShown: false}}
      component={WalletStackScreen}
    />
  </DrawerStack.Navigator>
);

const RootStackScreen = () => {
  return (
    <RootStack.Navigator headerMode="none">
      <RootStack.Screen
        name={AvaNavigation.Stack.Auth}
        component={AuthStackScreen}
        options={{
          animationEnabled: false,
        }}
      />
      <RootStack.Screen
        name={AvaNavigation.Stack.App}
        component={DrawerScreen}
        options={{
          animationEnabled: false,
        }}
      />
    </RootStack.Navigator>
  );
};

export default function App() {
  const context = useContext(ApplicationContext);
  const networkContext = useNetworkContext();
  const {userDidLogout} = useAuthContext();

  useEffect(() => {
    if (userDidLogout) {
      console.log('userDidLogout - true');
      navigationRef?.current?.dispatch(
        StackActions.replace('Auth', {screen: 'Onboard'}),
      );
    } else {
      console.log('userDidLogout - false');
    }
  }, [userDidLogout]);

  useEffect(() => {
    networkContext!.setNetwork(FUJI_NETWORK);
    BackHandler.addEventListener(
      'hardwareBackPress',
      AppViewModel.onBackPressed,
    );

    return () => {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        AppViewModel.onBackPressed,
      );
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer
        theme={context.navContainerTheme}
        ref={navigationRef}>
        <RootStackScreen />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
