/**
 * Avalanche Wallet App
 *
 * @format
 * @flow strict-local
 */

import React, {useEffect, useState} from 'react'
import {Alert, Appearance, BackHandler, NativeEventSubscription, SafeAreaView, StatusBar,} from 'react-native'
import AppViewModel, {
  ExitPromptAnswers,
  LogoutEvents,
  LogoutPromptAnswers,
  SelectedView,
  ShowExitPrompt,
  ShowLogoutPrompt
} from './src/AppViewModel'
import CommonViewModel from './src/CommonViewModel'
import Login from './src/login/Login'
import Onboard from './src/onboarding/Onboard'
import CreateWallet from './src/onboarding/CreateWallet'
import CheckMnemonic from "./src/onboarding/CheckMnemonic"
import MainView from "./src/mainView/MainView"
import {COLORS, COLORS_NIGHT} from "./src/common/Constants"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import {Subscription} from "rxjs"
import HdWalletLogin from "./src/login/HdWalletLogin"

type AppProps = {}

export default function App(props: AppProps | Readonly<AppProps>) {
  const [commonViewModel] = useState(new CommonViewModel(Appearance.getColorScheme()))
  const [viewModel] = useState(new AppViewModel())
  const [backHandler, setBackHandler] = useState<NativeEventSubscription>()
  const [isDarkMode] = useState(commonViewModel.isDarkMode)
  const [backgroundStyle] = useState(commonViewModel.appBackgroundStyle)
  const [selectedView, setSelectedView] = useState(SelectedView.Onboard)

  useEffect(() => {
    viewModel.onComponentMount()
    const disposables = new Subscription()
    disposables.add(viewModel.selectedView.subscribe(value => setSelectedView(value)))

    setBackHandler(BackHandler.addEventListener(
      "hardwareBackPress",
      viewModel.onBackPressed
    ))

    return () => {
      disposables.unsubscribe()
      backHandler?.remove()
    }
  }, [])


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

  const onOk = (value: ShowExitPrompt): void => {
    value.prompt.next(ExitPromptAnswers.Ok)
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

  const getSelectedView = (): Element => {
    switch (selectedView) {
      case SelectedView.CreateWallet:
        return <CreateWallet
          onSavedMyPhrase={onSavedMnemonic}
          onBack={() => viewModel.onBackPressed()}/>
      case SelectedView.CheckMnemonic:
        if (viewModel.wallet === null) throw Error("Wallet not defined")
        return <CheckMnemonic
          onSuccess={() => viewModel.setSelectedView(SelectedView.Main)}
          onBack={() => viewModel.onBackPressed()}
          mnemonic={(viewModel.wallet as MnemonicWallet).mnemonic}/>
      case SelectedView.Onboard:
        return <Onboard
          onEnterSingletonWallet={onEnterSingletonWallet}
          onEnterWallet={onEnterWallet}
          onAlreadyHaveWallet={() => viewModel.setSelectedView(SelectedView.Login)}
          onLoginWithMnemonic={() => viewModel.setSelectedView(SelectedView.LoginWithMnemonic)}
          onCreateWallet={() => viewModel.setSelectedView(SelectedView.CreateWallet)}/>
      case SelectedView.Login:
        return <Login
          onEnterSingletonWallet={onEnterSingletonWallet}
          onEnterWallet={onEnterWallet}
          onBack={() => viewModel.onBackPressed()}/>
      case SelectedView.LoginWithMnemonic:
        return <HdWalletLogin
          onEnterSingletonWallet={onEnterSingletonWallet}
          onEnterWallet={onEnterWallet}
          onBack={() => viewModel.onBackPressed()}/>
      case SelectedView.Main:
        if (viewModel.wallet === null) throw Error("Wallet not defined")
        return <MainView wallet={viewModel.wallet} onExit={onExit} onSwitchWallet={onSwitchWallet}/>
    }
  }

  const THEME = isDarkMode ? COLORS_NIGHT : COLORS
  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        backgroundColor={THEME.bg}
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
      {getSelectedView()}
    </SafeAreaView>
  )

}
