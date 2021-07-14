/**
 * Avalanche Wallet App
 *
 * @format
 * @flow strict-local
 */

import React, {Component} from 'react'
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

type AppProps = {}
type AppState = {
  backgroundStyle: any
  isDarkMode: boolean
  selectedView: SelectedView
}

class App extends Component<AppProps, AppState> {
  viewModel: AppViewModel = new AppViewModel()
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())
  private backHandler?: NativeEventSubscription


  constructor(props: AppProps | Readonly<AppProps>) {
    super(props)
    this.state = {
      backgroundStyle: {},
      isDarkMode: false,
      selectedView: SelectedView.Onboard,
    }
  }

  componentWillUnmount() {
    this.backHandler?.remove()
  }

  componentDidMount() {
    this.viewModel.onComponentMount()
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.appBackgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
    this.viewModel.selectedView.subscribe(value => this.setState({selectedView: value}))

    this.backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      this.viewModel.onBackPressed
    );
  }

  private onEnterWallet = (mnemonic: string): void => {
    this.viewModel.onEnterWallet(mnemonic).subscribe({
      error: err => Alert.alert(err.message),
    })
  }

  private onEnterSingletonWallet = (privateKey: string): void => {
    this.viewModel.onEnterSingletonWallet(privateKey).subscribe({
      error: err => Alert.alert(err.message),
    })
  }

  private onSavedMnemonic = (mnemonic: string): void => {
    this.viewModel.onSavedMnemonic(mnemonic)
  }

  private onYes = (value: ShowLogoutPrompt): void => {
    value.prompt.next(LogoutPromptAnswers.Yes)
    value.prompt.complete()
  }

  private onOk = (value: ShowExitPrompt): void => {
    value.prompt.next(ExitPromptAnswers.Ok)
    value.prompt.complete()
  }

  private onCancel = (value: ShowLogoutPrompt): void => {
    value.prompt.next(LogoutPromptAnswers.Cancel)
    value.prompt.complete()
  }

  private onSwitchWallet = (): void => {
    this.viewModel.onLogout().subscribe({
      next: (value: LogoutEvents) => {
        if ("prompt" in value) {
          Alert.alert("Do you want to delete the stored passphrase and switch accounts?", undefined, [
            {text: 'Cancel', onPress: () => this.onCancel(value as ShowLogoutPrompt), style: 'cancel'},
            {text: 'Yes', onPress: () => this.onYes(value as ShowLogoutPrompt)},
          ])
        }
      },
      error: err => Alert.alert(err.message),
    })
  }

  private onExit = (): void => {
    this.viewModel.onExit().subscribe({
      next: (value: LogoutEvents) => {
        if ("prompt" in value) {
          Alert.alert("Your passphrase will remain securely stored for easier later access of wallet.", undefined, [
            {text: 'Ok', onPress: () => this.onOk(value as ShowExitPrompt)},
          ])
        }
      },
      error: err => Alert.alert(err.message),
    })
  }

  getSelectedView = (): Element => {
    switch (this.state.selectedView) {
      case SelectedView.CreateWallet:
        return <CreateWallet
          onSavedMyPhrase={this.onSavedMnemonic}
          onBack={() => this.viewModel.onBackPressed()}/>
      case SelectedView.CheckMnemonic:
        if (this.viewModel.wallet === null) throw Error("Wallet not defined")
        return <CheckMnemonic
          onSuccess={() => this.viewModel.setSelectedView(SelectedView.Main)}
          onBack={() => this.viewModel.onBackPressed()}
          mnemonic={(this.viewModel.wallet as MnemonicWallet).mnemonic}/>
      case SelectedView.Onboard:
        return <Onboard
          onEnterSingletonWallet={this.onEnterSingletonWallet}
          onEnterWallet={this.onEnterWallet}
          onAlreadyHaveWallet={() => this.viewModel.setSelectedView(SelectedView.Login)}
          onCreateWallet={() => this.viewModel.setSelectedView(SelectedView.CreateWallet)}/>
      case SelectedView.Login:
        return <Login
          onEnterSingletonWallet={this.onEnterSingletonWallet}
          onEnterWallet={this.onEnterWallet}
          onBack={() => this.viewModel.onBackPressed()}/>
      case SelectedView.Main:
        if (this.viewModel.wallet === null) throw Error("Wallet not defined")
        return <MainView wallet={this.viewModel.wallet} onExit={this.onExit} onSwitchWallet={this.onSwitchWallet}/>
    }
  }

  render() {
    const THEME = this.state.isDarkMode ? COLORS_NIGHT : COLORS
    return (
      <SafeAreaView style={this.state.backgroundStyle}>
        <StatusBar
          backgroundColor={THEME.bg}
          barStyle={this.state.isDarkMode ? "light-content" : "dark-content"}
        />
        {this.getSelectedView()}
      </SafeAreaView>
    )
  }
}

export default App
