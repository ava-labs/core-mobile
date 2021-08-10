/**
 * Avalanche Wallet App
 *
 * @format
 * @flow strict-local
 */

import React, {RefObject, useContext, useEffect, useState} from 'react';
import {Alert, BackHandler, SafeAreaView, StatusBar} from 'react-native';
import AppViewModel, {
  ExitPromptAnswers,
  LogoutEvents,
  LogoutPromptAnswers,
  SelectedView,
  ShowExitPrompt,
  ShowLogoutPrompt,
} from './utils/AppViewModel';
import Onboard from 'screens/onboarding/Onboard';
import CreateWallet from 'screens/onboarding/CreateWallet';
import MainView from 'screens/mainView/MainView';
import {Subscription} from 'rxjs';
import HdWalletLogin from 'screens/login/HdWalletLogin';
import {createStackNavigator} from '@react-navigation/stack';
import {
  NavigationContainer,
  NavigationContainerRef,
  Theme,
} from '@react-navigation/native';
import CheckMnemonic from 'screens/onboarding/CheckMnemonic';
import CreatePIN from 'screens/onboarding/CreatePIN';
import BiometricLogin from 'screens/onboarding/BiometricLogin';
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin';
import {ApplicationContext} from 'contexts/applicationContext';

const RootStack = createStackNavigator();
const CreateWalletStack = createStackNavigator();
const navigationRef: RefObject<NavigationContainerRef> = React.createRef();
const viewModel = new AppViewModel();

const onOk = (value: ShowExitPrompt): void => {
  value.prompt.next(ExitPromptAnswers.Ok);
  value.prompt.complete();
};

const onExit = (): void => {
  viewModel.onExit().subscribe({
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
          ],
        );
      }
    },
    error: err => Alert.alert(err.message),
  });
};

const onEnterWallet = (mnemonic: string): void => {
  viewModel.onEnterWallet(mnemonic).subscribe({
    error: err => Alert.alert(err.message),
  });
};

const onSavedMnemonic = (mnemonic: string): void => {
  viewModel.onSavedMnemonic(mnemonic);
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
  viewModel.onLogout().subscribe({
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

const OnboardScreen = () => {
  return (
    <Onboard
      onEnterWallet={onEnterWallet}
      onAlreadyHaveWallet={() =>
        viewModel.setSelectedView(SelectedView.LoginWithMnemonic)
      }
      onCreateWallet={() =>
        viewModel.setSelectedView(SelectedView.CreateWallet)
      }
    />
  );
};

const CreateWalletScreen = () => {
  return (
    <CreateWallet
      onSavedMyPhrase={onSavedMnemonic}
      onBack={() => viewModel.onBackPressed()}
    />
  );
};

const CheckMnemonicScreen = () => {
  return (
    <CheckMnemonic
      onSuccess={() => viewModel.setSelectedView(SelectedView.CreatePin)}
      onBack={() => viewModel.onBackPressed()}
      mnemonic={viewModel.wallet?.mnemonic || ''}
    />
  );
};

const onPinSet = (pin: string): void => {
  viewModel.onPinCreated(pin).subscribe({
    error: err => Alert.alert(err.message),
  });
};

const CreatePinScreen = () => {
  return (
    <CreatePIN onPinSet={onPinSet} onBack={() => viewModel.onBackPressed()} />
  );
};

const BiometricLoginScreen = () => {
  return (
    <BiometricLogin
      wallet={viewModel.wallet!}
      onBiometrySet={() => viewModel.setSelectedView(SelectedView.Main)}
      onSkip={() => viewModel.setSelectedView(SelectedView.Main)}
    />
  );
};

const LoginWithMnemonicScreen = () => {
  return (
    <HdWalletLogin
      onEnterWallet={onEnterWallet}
      onBack={() => viewModel.onBackPressed()}
    />
  );
};

const LoginWithPinOrBiometryScreen = () => {
  return (
    <PinOrBiometryLogin
      onBack={() => viewModel.onBackPressed()}
      onEnterWallet={onEnterWallet}
    />
  );
};

const WalletScreen = () => {
  if (viewModel.wallet === null) {
    throw Error('Wallet not defined');
  }
  return (
    <MainView
      wallet={viewModel.wallet}
      onExit={onExit}
      onSwitchWallet={onSwitchWallet}
    />
  );
};

const CreateWalletFlow = () => {
  return (
    <CreateWalletStack.Navigator
      headerMode="none"
      detachInactiveScreens={false}
      mode="card">
      <CreateWalletStack.Screen
        name="Create Wallet"
        component={CreateWalletScreen}
      />
      <CreateWalletStack.Screen
        name="Check mnemonic"
        component={CheckMnemonicScreen}
      />
      <CreateWalletStack.Screen name="Create pin" component={CreatePinScreen} />
      <CreateWalletStack.Screen
        name="Biometric login"
        component={BiometricLoginScreen}
      />
    </CreateWalletStack.Navigator>
  );
};

const RootScreen = () => {
  return (
    <RootStack.Navigator
      headerMode="none"
      detachInactiveScreens={true}
      mode="modal">
      <RootStack.Screen name="Onboard" component={OnboardScreen} />
      <RootStack.Screen
        name="Create Wallet flow"
        component={CreateWalletFlow}
      />
      <RootStack.Screen
        name="Login with mnemonic"
        component={LoginWithMnemonicScreen}
      />
      <RootStack.Screen name="Login" component={LoginWithPinOrBiometryScreen} />
      <RootStack.Screen name="Wallet" component={WalletScreen} />
    </RootStack.Navigator>
  );
};

export default function App() {
  const context = useContext(ApplicationContext);
  const [isDarkMode] = useState(context.isDarkMode);
  const [backgroundStyle] = useState(context.appBackgroundStyle);
  const [selectedView, setSelectedView] = useState(SelectedView.Onboard);

  useEffect(() => {
    viewModel.onComponentMount();
    const disposables = new Subscription();
    disposables.add(
      viewModel.selectedView.subscribe(value => setSelectedView(value)),
    );
    BackHandler.addEventListener('hardwareBackPress', viewModel.onBackPressed);

    return () => {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        viewModel.onBackPressed,
      );
      disposables.unsubscribe();
    };
  }, []);

  useEffect(() => {
    switch (selectedView) {
      case SelectedView.Onboard:
        navigationRef.current?.navigate('Onboard');
        break;
      case SelectedView.CreateWallet:
        navigationRef.current?.navigate('Create Wallet flow', {
          screen: 'Create Wallet',
        });
        break;
      case SelectedView.CheckMnemonic:
        navigationRef.current?.navigate('Create Wallet flow', {
          screen: 'Check mnemonic',
        });
        break;
      case SelectedView.CreatePin:
        navigationRef.current?.navigate('Create Wallet flow', {
          screen: 'Create pin',
        });
        break;
      case SelectedView.BiometricStore:
        navigationRef.current?.navigate('Create Wallet flow', {
          screen: 'Biometric login',
        });
        break;
      case SelectedView.LoginWithMnemonic:
        navigationRef.current?.navigate('Login with mnemonic');
        break;
      case SelectedView.PinOrBiometryLogin:
        navigationRef.current?.navigate('Login');
        break;
      case SelectedView.Main:
        navigationRef.current?.navigate('Wallet');
        break;
    }
  }, [selectedView]);

  const theme = context.theme;
  const navTheme: Theme = {
    dark: context.isDarkMode,
    colors: {
      primary: theme.primaryColor,
      background: theme.bg,
      text: theme.textOnBg,
      card: theme.primaryColor,
      border: theme.bg,
      notification: theme.primaryColor,
    },
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        backgroundColor={theme.bg}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <NavigationContainer theme={navTheme} ref={navigationRef}>
        <RootScreen />
      </NavigationContainer>
    </SafeAreaView>
  );
}
