/**
 * Avalanche Wallet App
 *
 * @format
 * @flow strict-local
 */

import React, {useEffect, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  LogBox,
  Platform,
  SafeAreaView,
} from 'react-native';
import WalletScreenStack from 'navigation/WalletScreenStack';
import {NavigationContainer} from '@react-navigation/native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {
  FUJI_NETWORK,
  useNetworkContext,
  WalletStateContextProvider,
} from '@avalabs/wallet-react-components';
import AppNavigation from 'navigation/AppNavigation';
import {ExitEvents, ExitPromptAnswers, ShowExitPrompt} from 'AppViewModel';
import {useWalletSetup} from 'hooks/useWalletSetup';
import {OnboardScreenStack} from 'navigation/OnboardScreenStack';
import {createStackNavigator} from '@react-navigation/stack';

const RootStack = createStackNavigator();

LogBox.ignoreAllLogs();

const onOk = (value: ShowExitPrompt): void => {
  value.prompt.next(ExitPromptAnswers.Ok);
  value.prompt.complete();
};

const onNo = (value: ShowExitPrompt): void => {
  value.prompt.next(ExitPromptAnswers.Cancel);
  value.prompt.complete();
};

const WalletScreenStackWithContext = () => {
  const {onExit} = useApplicationContext().appHook;

  const doExit = () => {
    onExit().subscribe({
      next: (value: ExitEvents) => {
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

  return (
    <WalletStateContextProvider>
      <WalletScreenStack onExit={doExit} />
    </WalletStateContextProvider>
  );
};

const RootScreenStack = () => {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
      }}>
      <RootStack.Screen
        name={AppNavigation.Root.Onboard}
        component={OnboardScreenStack}
        options={{
          animationEnabled: false,
        }}
      />
      <RootStack.Screen
        name={AppNavigation.Root.Wallet}
        component={WalletScreenStackWithContext}
        options={{
          animationEnabled: false,
          presentation: 'card',
        }}
      />
    </RootStack.Navigator>
  );
};

export default function App() {
  const context = useApplicationContext();
  const networkContext = useNetworkContext();
  const [backgroundStyle] = useState(context.appBackgroundStyle);
  const {shouldSetupWallet, mnemonic, isNewWallet} = context.appHook;
  const {initWalletWithMnemonic, createNewWallet} = useWalletSetup();

  useEffect(() => {
    networkContext?.setNetwork(FUJI_NETWORK);
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

  return (
    <SafeAreaView style={backgroundStyle}>
      <KeyboardAvoidingView
        enabled={context.keyboardAvoidingViewEnabled}
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <NavigationContainer
          theme={context.navContainerTheme}
          ref={context.appHook.navigation}>
          <RootScreenStack />
        </NavigationContainer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
