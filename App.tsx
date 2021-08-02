/**
 * Avalanche Wallet App
 *
 * @format
 * @flow strict-local
 */

import React, {RefObject, useEffect, useState} from 'react'
import {Alert, Appearance, BackHandler, SafeAreaView, StatusBar,} from 'react-native'
import AppViewModel, {
  ExitPromptAnswers,
  LogoutEvents,
  LogoutPromptAnswers,
  SelectedView,
  ShowExitPrompt,
  ShowLogoutPrompt
} from './src/AppViewModel'
import CommonViewModel from './src/CommonViewModel'
import Onboard from './src/onboarding/Onboard'
import CreateWallet from './src/onboarding/CreateWallet'
import MainView from "./src/mainView/MainView"
import {COLORS, COLORS_NIGHT} from "./src/common/Constants"
import {Subscription} from "rxjs"
import HdWalletLogin from "./src/login/HdWalletLogin"
import PrivateKeyLogin from "./src/login/PrivateKeyLogin"
import KeystoreLogin from "./src/login/KeystoreLogin"
import {createStackNavigator} from '@react-navigation/stack'
import {NavigationContainer, NavigationContainerRef, Theme} from "@react-navigation/native"
import CheckMnemonic from "./src/onboarding/CheckMnemonic"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import CreatePIN from "./src/onboarding/CreatePIN"
import BiometricLogin from "./src/onboarding/BiometricLogin"

type AppProps = {}

const RootStack = createStackNavigator();
const CreateWalletStack = createStackNavigator();
const navigationRef: RefObject<NavigationContainerRef> = React.createRef()
const commonViewModel = new CommonViewModel(Appearance.getColorScheme())
const viewModel = new AppViewModel()


const onOk = (value: ShowExitPrompt): void => {
  value.prompt.next(ExitPromptAnswers.Ok)
  value.prompt.complete()
}

const onExit = (): void => {
  viewModel.onExit().subscribe({
    next: (value: LogoutEvents) => {
      if (value instanceof ShowExitPrompt) {
        Alert.alert("Your passphrase will remain securely stored for easier later access of wallet.", undefined, [
          {text: 'Ok', onPress: () => onOk(value as ShowExitPrompt)},
        ])
      }
    },
    error: err => Alert.alert(err.message),
  })
}


const onEnterWallet = (mnemonic: string): void => {
  viewModel.onEnterWallet(mnemonic).subscribe({
    error: err => Alert.alert(err.message),
  })
}

const onEnterSingletonWallet = (constKey: string): void => {
  viewModel.onEnterSingletonWallet(constKey).subscribe({
    error: err => Alert.alert(err.message),
  })
}

const onSavedMnemonic = (mnemonic: string): void => {
  viewModel.onSavedMnemonic(mnemonic)
}

const onYes = (value: ShowLogoutPrompt): void => {
  value.prompt.next(LogoutPromptAnswers.Yes)
  value.prompt.complete()
}

const onCancel = (value: ShowLogoutPrompt): void => {
  value.prompt.next(LogoutPromptAnswers.Cancel)
  value.prompt.complete()
}

const onSwitchWallet = (): void => {
  viewModel.onLogout().subscribe({
    next: (value: LogoutEvents) => {
      if (value instanceof ShowLogoutPrompt) {
        Alert.alert("Do you want to delete the stored passphrase and switch accounts?", undefined, [
          {text: 'Cancel', onPress: () => onCancel(value as ShowLogoutPrompt), style: 'cancel'},
          {text: 'Yes', onPress: () => onYes(value as ShowLogoutPrompt)},
        ])
      }
    },
    error: err => Alert.alert(err.message),
  })
}

const OnboardScreen = () => {
  return (
    <Onboard
      onEnterSingletonWallet={onEnterSingletonWallet}
      onEnterWallet={onEnterWallet}
      onAlreadyHaveWallet={() => viewModel.setSelectedView(SelectedView.LoginWithMnemonic)}
      onCreateWallet={() => viewModel.setSelectedView(SelectedView.CreateWallet)}/>
  )
}

const CreateWalletScreen = () => {
  return (
    <CreateWallet
      onSavedMyPhrase={onSavedMnemonic}
      onBack={() => viewModel.onBackPressed()}/>
  )
}

const CheckMnemonicScreen = () => {
  return (
    <CheckMnemonic
      onSuccess={() => viewModel.setSelectedView(SelectedView.CreatePin)}
      onBack={() => viewModel.onBackPressed()}
      mnemonic={(viewModel.wallet as MnemonicWallet)?.mnemonic}/>
  )
}

const onPinSet = (pin: string): void => {
  viewModel.onPinCreated(pin).subscribe({
    error: err => Alert.alert(err.message)
  })
}

const CreatePinScreen = () => {
  return (
    <CreatePIN
      onPinSet={onPinSet}
      onBack={() => viewModel.onBackPressed()}/>
  )
}

const BiometricLoginScreen = () => {
  return (
    <BiometricLogin
      wallet={viewModel.wallet as MnemonicWallet}
      onBiometrySet={() => viewModel.setSelectedView(SelectedView.Main)}
      onSkip={() => viewModel.setSelectedView(SelectedView.Main)}/>
  )
}

const LoginWithMnemonicScreen = () => {
  return (
    <HdWalletLogin
      onEnterWallet={onEnterWallet}
      onBack={() => viewModel.onBackPressed()}/>
  )
}

const LoginWithPrivateKeyScreen = () => {
  return (
    <PrivateKeyLogin
      onEnterSingletonWallet={onEnterSingletonWallet}
      onBack={() => viewModel.onBackPressed()}/>
  )
}

const LoginWithKeystoreFileScreen = () => {
  return (
    <KeystoreLogin
      onEnterWallet={onEnterWallet}
      onBack={() => viewModel.onBackPressed()}/>
  )
}

const WalletScreen = () => {
  if (viewModel.wallet === null) throw Error("Wallet not defined")
  return (
    <MainView wallet={viewModel.wallet} onExit={onExit} onSwitchWallet={onSwitchWallet}/>
  )
}

const CreateWalletFlow = () => {
  return (
    <CreateWalletStack.Navigator headerMode="none" detachInactiveScreens={false} mode="card">
      <CreateWalletStack.Screen name="Create Wallet" component={CreateWalletScreen}/>
      <CreateWalletStack.Screen name="Check mnemonic" component={CheckMnemonicScreen}/>
      <CreateWalletStack.Screen name="Create pin" component={CreatePinScreen}/>
      <CreateWalletStack.Screen name="Biometric login" component={BiometricLoginScreen}/>
    </CreateWalletStack.Navigator>
  )
}

const RootScreen = () => {
  return (
    <RootStack.Navigator headerMode="none" detachInactiveScreens={true} mode="modal">
      <RootStack.Screen name="Onboard" component={OnboardScreen}/>
      <RootStack.Screen name="Create Wallet flow" component={CreateWalletFlow}/>
      <RootStack.Screen name="Login with mnemonic" component={LoginWithMnemonicScreen}/>
      <RootStack.Screen name="Login with private key" component={LoginWithPrivateKeyScreen}/>
      <RootStack.Screen name="Login with keystore file" component={LoginWithKeystoreFileScreen}/>
      <RootStack.Screen name="Wallet" component={WalletScreen}/>
    </RootStack.Navigator>
  )
}

export default function App(props: AppProps | Readonly<AppProps>) {
  const [isDarkMode] = useState(commonViewModel.isDarkMode)
  const [backgroundStyle] = useState(commonViewModel.appBackgroundStyle)
  const [selectedView, setSelectedView] = useState(SelectedView.Onboard)

  useEffect(() => {
    viewModel.onComponentMount()
    const disposables = new Subscription()
    disposables.add(viewModel.selectedView.subscribe(value => setSelectedView(value)))
    BackHandler.addEventListener('hardwareBackPress', viewModel.onBackPressed);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', viewModel.onBackPressed);
      disposables.unsubscribe()
    }
  }, [])


  useEffect(() => {
    switch (selectedView) {
      case SelectedView.Onboard:
        navigationRef.current?.navigate("Onboard")
        break;
      case SelectedView.CreateWallet:
        navigationRef.current?.navigate("Create Wallet flow", {screen: "Create Wallet"})
        break;
      case SelectedView.CheckMnemonic:
        navigationRef.current?.navigate("Create Wallet flow", {screen: "Check mnemonic"})
        break;
      case SelectedView.CreatePin:
        navigationRef.current?.navigate("Create Wallet flow", {screen: "Create pin"})
        break;
      case SelectedView.BiometricLogin:
        navigationRef.current?.navigate("Create Wallet flow", {screen: "Biometric login"})
        break;
      case SelectedView.LoginWithMnemonic:
        navigationRef.current?.navigate("Login with mnemonic")
        break;
      case SelectedView.LoginWithPrivateKey:
        navigationRef.current?.navigate("Login with private key")
        break;
      case SelectedView.LoginWithKeystoreFile:
        navigationRef.current?.navigate("Login with keystore file")
        break;
      case SelectedView.Main:
        navigationRef.current?.navigate("Wallet")
        break;
    }
  }, [selectedView])


  const THEME = isDarkMode ? COLORS_NIGHT : COLORS
  const navTheme: Theme = {
    dark: isDarkMode,
    colors: {
      primary: THEME.primaryColor,
      background: THEME.bg,
      text: THEME.textOnBg,
      card: THEME.primaryColor,
      border: THEME.bg,
      notification: THEME.primaryColor,
    }
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        backgroundColor={THEME.bg}
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
      <NavigationContainer theme={navTheme} ref={navigationRef}>
        <RootScreen/>
      </NavigationContainer>
    </SafeAreaView>
  )

}
