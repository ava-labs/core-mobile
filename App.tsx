/**
 * Avalanche Wallet App
 *
 * @format
 * @flow strict-local
 */

import React, {Component} from "react"
import {Appearance, SafeAreaView, StatusBar, StyleSheet,} from "react-native"
import AppViewModel, {SelectedView} from "./src/AppViewModel"
import CommonViewModel from "./src/CommonViewModel"
import Login from "./src/login/Login"
import MainView from "./src/mainView/MainView"
import {MnemonicWallet} from "./wallet_sdk"

type AppProps = {}
type AppState = {
  backgroundStyle: any
  isDarkMode: boolean
  selectedView: SelectedView
  wallet: MnemonicWallet | null
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
      wallet: null
    }
  }

  componentWillUnmount() {
  }

  componentDidMount() {
    this.commonViewModel.isDarkMode.subscribe(value => {
      this.setState({isDarkMode: value})
    })
    this.commonViewModel.backgroundStyle.subscribe(value => {
      this.setState({backgroundStyle: value})
    })

    this.viewModel.onComponentMount()

    this.viewModel.selectedView.subscribe(value => {
      this.setState({selectedView: value})
    })

    this.viewModel.wallet.subscribe(value => {
      this.setState({wallet: value})
    })
  }

  onEnterWallet(mnemonic: string): void {
    this.viewModel.onEnterWallet(mnemonic)
  }

  getSelectedView(): Element {
    switch (this.state.selectedView) {
      case SelectedView.Login:
        return <Login onEnterWallet={mnemonic => this.onEnterWallet(mnemonic)}/>
      case SelectedView.Main:
        if (this.state.wallet === null) throw Error("Wallet not defined")
        return <MainView wallet={this.state.wallet} onLogout={() => this.viewModel.onLogout()}/>
      default:
        throw Error("invalid state")
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

const styles = StyleSheet.create({
  text: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 26
  },
  input: {
    padding: 10,
    margin: 12,
    borderWidth: 1,
  },
})
export default App
