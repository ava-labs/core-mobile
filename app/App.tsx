/**
 * Avalanche Wallet App
 *
 * @format
 * @flow strict-local
 */

import React, {
  Dispatch,
  RefObject,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  Alert,
  BackHandler,
  InteractionManager,
  LogBox,
  SafeAreaView,
} from 'react-native';
import WalletStackScreen from 'screens/mainView/WalletStackScreen';
import {Subscription} from 'rxjs';
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
  SelectedView,
  ShowExitPrompt,
  ShowLogoutPrompt,
} from 'AppViewModel';
import {
  FUJI_NETWORK,
  useNetworkContext,
  WalletStateContextProvider,
} from '@avalabs/wallet-react-components';
import AppNavigation, {OnboardScreens} from 'navigation/AppNavigation';
import {OnboardStackScreen} from 'navigation/OnboardStackScreen';

const RootStack = createStackNavigator();
const navigationRef: RefObject<NavigationContainerRef<any>> = React.createRef();

LogBox.ignoreAllLogs();

const onOk = (value: ShowExitPrompt): void => {
  value.prompt.next(ExitPromptAnswers.Ok);
  value.prompt.complete();
};

const onNo = (value: ShowExitPrompt): void => {
  value.prompt.next(ExitPromptAnswers.Cancel);
  value.prompt.complete();
};

const onExit = () => {
  AppViewModel.onExit().subscribe({
    next: (value: LogoutEvents) => {
      if (value instanceof ShowExitPrompt) {
        Alert.alert(
          'Logout?',
          'Your passphrase will remain securely stored for easier later access of wallet.',
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

export const onEnterWallet = (
  mnemonic: string,
  setMnemonic?: Dispatch<string>,
): void => {
  AppViewModel.onEnterWallet(mnemonic).subscribe({
    next: () => {
      InteractionManager.runAfterInteractions(() => {
        setMnemonic?.(mnemonic);
      });
    },
    error: err => Alert.alert(err.message),
  });
};

const onYes = (value: ShowLogoutPrompt): void => {
  value.prompt.next(LogoutPromptAnswers.Yes);
  value.prompt.complete();
};

const onCancel = (value: ShowLogoutPrompt): void => {
  value.prompt.next(LogoutPromptAnswers.Cancel);
  value.prompt.complete();
};

const onSwitchWallet = (): void => {
  AppViewModel.onLogout().subscribe({
    next: (value: LogoutEvents) => {
      if (value instanceof ShowLogoutPrompt) {
        Alert.alert(
          'Do you want to delete the stored passphrase and switch accounts?',
          undefined,
          [
            {
              text: 'Cancel',
              onPress: () => onCancel(value as ShowLogoutPrompt),
              style: 'cancel',
            },
            {text: 'Yes', onPress: () => onYes(value as ShowLogoutPrompt)},
          ],
        );
      }
    },
    error: err => Alert.alert(err.message),
  });
};

const WalletStackScreenWithProps = () => {
  return (
    <WalletStateContextProvider>
      <WalletStackScreen onExit={onExit} onSwitchWallet={onSwitchWallet} />
    </WalletStateContextProvider>
  );
};

const RootStackScreen = () => {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
      }}>
      <RootStack.Screen
        name={AppNavigation.Stack.Auth}
        component={OnboardStackScreen}
        options={{
          animationEnabled: false,
        }}
      />
      <RootStack.Screen
        name={AppNavigation.Stack.App}
        component={WalletStackScreenWithProps}
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
  const [backgroundStyle] = useState(context.appBackgroundStyle);
  const [selectedView, setSelectedView] = useState<SelectedView | undefined>(
    undefined,
  );

  useEffect(() => {
    networkContext!.setNetwork(FUJI_NETWORK);
    AppViewModel.onComponentMount();
    const disposables = new Subscription();
    disposables.add(
      AppViewModel.selectedView.subscribe(value => setSelectedView(value)),
    );
    BackHandler.addEventListener(
      'hardwareBackPress',
      AppViewModel.onBackPressed,
    );

    return () => {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        AppViewModel.onBackPressed,
      );
      disposables.unsubscribe();
    };
  }, []);

  useEffect(() => {
    switch (selectedView) {
      case SelectedView.Onboard:
        navigationRef.current?.navigate('Auth', {
          screen: OnboardScreens.Onboard,
        });
        break;
      case SelectedView.CreateWallet:
        navigationRef.current?.navigate(OnboardScreens.CreateWalletFlow, {
          screen: AppNavigation.CreateWallet.CreateWallet,
        });
        break;
      case SelectedView.CheckMnemonic:
        navigationRef.current?.navigate(OnboardScreens.CreateWalletFlow, {
          screen: AppNavigation.CreateWallet.CheckMnemonic,
        });
        break;
      case SelectedView.CreatePin:
        navigationRef.current?.navigate(OnboardScreens.CreateWalletFlow, {
          screen: AppNavigation.CreateWallet.CreatePin,
        });
        break;
      case SelectedView.CreatePinForExistingWallet:
        navigationRef.current?.navigate(OnboardScreens.CreateWalletFlow, {
          screen: AppNavigation.CreateWallet.CreatePin,
        });
        break;
      case SelectedView.BiometricStore:
        navigationRef.current?.navigate(OnboardScreens.CreateWalletFlow, {
          screen: AppNavigation.CreateWallet.BiometricLogin,
        });
        break;
      case SelectedView.LoginWithMnemonic:
        navigationRef.current?.navigate(OnboardScreens.LoginWithMnemonic);
        break;
      case SelectedView.PinOrBiometryLogin:
        navigationRef.current?.navigate(OnboardScreens.Login);
        break;
      case SelectedView.Main:
        navigationRef.current?.dispatch(
          StackActions.replace('App', {screen: 'Home'}),
        );
        break;
      default:
        break;
    }
  }, [selectedView]);

  return (
    <SafeAreaView style={backgroundStyle}>
      <NavigationContainer
        theme={context.navContainerTheme}
        ref={navigationRef}>
        <RootStackScreen />
      </NavigationContainer>
    </SafeAreaView>
  );
}
