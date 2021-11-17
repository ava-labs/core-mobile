/**
 * Avalanche Wallet App
 *
 * @format
 * @flow strict-local
 */

import React, {RefObject, useEffect, useState} from 'react';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  LogBox,
  Platform,
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
import {useApplicationContext} from 'contexts/ApplicationContext';
import {
  FUJI_NETWORK,
  useNetworkContext,
  WalletStateContextProvider,
} from '@avalabs/wallet-react-components';
import AppNavigation, {OnboardScreens} from 'navigation/AppNavigation';
import {OnboardStackScreen} from 'navigation/OnboardStackScreen';
import {
  ExitPromptAnswers,
  LogoutEvents,
  LogoutPromptAnswers,
  SelectedView,
  ShowExitPrompt,
  ShowLogoutPrompt,
} from 'AppViewModel';
import {useWalletSetup} from 'hooks/useWalletSetup';

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

const onYes = (value: ShowLogoutPrompt): void => {
  value.prompt.next(LogoutPromptAnswers.Yes);
  value.prompt.complete();
};

const onCancel = (value: ShowLogoutPrompt): void => {
  value.prompt.next(LogoutPromptAnswers.Cancel);
  value.prompt.complete();
};

const WalletStackScreenWithProps = () => {
  const {onExit, onLogout} = useApplicationContext().appHook;

  const doExit = () => {
    onExit().subscribe({
      next: (value: LogoutEvents) => {
        if (value instanceof ShowExitPrompt) {
          Alert.alert(
            'Exit app?',
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

  const doSwitchWallet = (): void => {
    onLogout().subscribe({
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

  return (
    <WalletStateContextProvider>
      <WalletStackScreen onExit={doExit} onSwitchWallet={doSwitchWallet} />
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
  const context = useApplicationContext();
  const networkContext = useNetworkContext();
  const [backgroundStyle] = useState(context.appBackgroundStyle);
  const {
    selectedView,
    onBackPressed,
    shouldSetupWallet,
    mnemonic,
    isNewWallet,
  } = context.appHook;
  const {initWalletWithMnemonic, createNewWallet} = useWalletSetup();

  useEffect(() => {
    networkContext!.setNetwork(FUJI_NETWORK);
    const disposables = new Subscription();
    BackHandler.addEventListener('hardwareBackPress', onBackPressed);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPressed);
      disposables.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (shouldSetupWallet) {
      if (isNewWallet) {
        createNewWallet(mnemonic);
      } else {
        initWalletWithMnemonic(mnemonic);
      }
    }
  }, [shouldSetupWallet]);

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
        navigationRef.current?.navigate('Auth', {
          screen: OnboardScreens.LoginWithMnemonic,
        });
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
      <KeyboardAvoidingView
        enabled={context.keyboardAvoidingViewEnabled}
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <NavigationContainer
          theme={context.navContainerTheme}
          ref={navigationRef}>
          <RootStackScreen />
        </NavigationContainer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
