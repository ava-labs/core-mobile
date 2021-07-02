/**
 * Avalanche Wallet App
 *
 * @format
 * @flow strict-local
 */

import React, {Component} from 'react'
import {Alert, Appearance, BackHandler, NativeEventSubscription, SafeAreaView, StatusBar,} from 'react-native'
import AppViewModel, {SelectedView} from './src/AppViewModel'
import CommonViewModel from './src/CommonViewModel'
import Login from './src/login/Login'
import Onboard from './src/onboarding/Onboard'
import CreateWallet from './src/onboarding/CreateWallet'
import CheckMnemonic from "./src/onboarding/CheckMnemonic"
import MainView from "./src/mainView/MainView"
import {COLORS, COLORS_NIGHT} from "./src/common/Constants"

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
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
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

  private onSavedMnemonic = (mnemonic: string): void => {
    this.viewModel.onSavedMnemonic(mnemonic)
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
          mnemonic={this.viewModel.wallet.mnemonic}/>
      case SelectedView.Onboard:
        return <Onboard
          onAlreadyHaveWallet={() => this.viewModel.setSelectedView(SelectedView.Login)}
          onCreateWallet={() => this.viewModel.setSelectedView(SelectedView.CreateWallet)}/>
      case SelectedView.Login:
        return <Login
          onEnterWallet={this.onEnterWallet}
          onBack={() => this.viewModel.onBackPressed()}/>
      case SelectedView.Main:
        if (this.viewModel.wallet === null) throw Error("Wallet not defined")
        return <MainView wallet={this.viewModel.wallet} onLogout={() => this.viewModel.onLogout()}/>
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
