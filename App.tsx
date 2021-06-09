/**
 * Avalanche Wallet App
 *
 * @format
 * @flow strict-local
 */

import React, {Component} from 'react'
import {Appearance, SafeAreaView, StatusBar,} from 'react-native'
import AppViewModel, {SelectedView} from './src/AppViewModel'
import CommonViewModel from './src/CommonViewModel'
import Login from './src/login/Login'
import MainView from './src/mainView/MainView'
import Onboard from './src/onboarding/Onboard'
import CreateWallet from './src/onboarding/CreateWallet'

type AppProps = {}
type AppState = {
  backgroundStyle: any
  isDarkMode: boolean
  selectedView: SelectedView
}

class App extends Component<AppProps, AppState> {
  viewModel: AppViewModel = new AppViewModel()
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

  constructor(props: AppProps | Readonly<AppProps>) {
    super(props)
    this.state = {
      backgroundStyle: {},
      isDarkMode: false,
      selectedView: SelectedView.Login,
    }
  }

  componentWillUnmount() {
  }

  componentDidMount() {
    this.viewModel.onComponentMount()
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
    this.viewModel.selectedView.subscribe(value => this.setState({selectedView: value}))
  }

  onEnterWallet(mnemonic: string): void {
    this.viewModel.onEnterWallet(mnemonic)
  }

  getSelectedView(): Element {
    switch (this.state.selectedView) {
      case SelectedView.CreateWallet:
        return <CreateWallet
          onSavedMyPhrase={mnemonic => this.onEnterWallet(mnemonic)}
          onClose={() => this.viewModel.setSelectedView(SelectedView.Onboard)}/>
      case SelectedView.Onboard:
        return <Onboard
          onAlreadyHaveWallet={() => this.viewModel.setSelectedView(SelectedView.Login)}
          onCreateWallet={() => this.viewModel.setSelectedView(SelectedView.CreateWallet)}/>
      case SelectedView.Login:
        return <Login
          onEnterWallet={mnemonic => this.onEnterWallet(mnemonic)}
          onClose={() => this.viewModel.setSelectedView(SelectedView.Onboard)}/>
      case SelectedView.Main:
        if (this.viewModel.wallet === null) throw Error("Wallet not defined")
        return <MainView wallet={this.viewModel.wallet} onLogout={() => this.viewModel.onLogout()}/>
    }
  }

  render() {
    return (
      <SafeAreaView style={this.state.backgroundStyle}>
        <StatusBar
          barStyle={this.state.isDarkMode ? "light-content" : "dark-content"}
        />
        {this.getSelectedView()}
      </SafeAreaView>
    )
  }
}

export default App
