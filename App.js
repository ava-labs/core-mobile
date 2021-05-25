/**
 * Avalanche Wallet App
 *
 * @format
 * @flow strict-local
 */

import React, {Component} from 'react';
import {
  Appearance,
  SafeAreaView,
  ScrollView,
  StatusBar,
  View,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import Section from './src/mainView/Section';
import Header from './src/mainView/Header';
import AppViewModel from './src/AppViewModel';

class App extends Component {
  viewModel: AppViewModel = new AppViewModel(Appearance.getColorScheme());

  constructor() {
    super();
    this.state = {
      avaxPrice: 0,
      backgroundStyle: {},
      mnemonic: '',
      walletCAddress: '',
      walletEvmAddress: '',
      isDarkMode: false,
    };
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
  }
  componentDidMount() {
    console.log('componentDidMount');
    this.viewModel.onComponentMount();

    this.viewModel.avaxPrice.subscribe(value => {
      this.setState({avaxPrice: value});
    });
    this.viewModel.mnemonic.subscribe(value => {
      this.setState({mnemonic: value});
    });
    this.viewModel.walletCAddress.subscribe(value => {
      this.setState({walletCAddress: value});
    });
    this.viewModel.walletEvmAddrBech.subscribe(value => {
      this.setState({walletEvmAddress: value});
    });
    this.viewModel.isDarkMode.subscribe(value => {
      this.setState({isDarkMode: value});
    });
    this.viewModel.backgroundStyle.subscribe(value => {
      this.setState({backgroundStyle: value});
    });
  }

  render() {
    console.log('render');
    return (
      <SafeAreaView style={this.state.backgroundStyle}>
        <StatusBar
          barStyle={this.state.isDarkMode ? 'light-content' : 'dark-content'}
        />
        <ScrollView
          contentInsetAdjustmentBehavior="always"
          style={this.state.backgroundStyle}>
          <Header />
          <View
            style={{
              backgroundColor: this.state.isDarkMode
                ? Colors.black
                : Colors.white,
            }}>
            <Section title="Avax price">${this.state.avaxPrice}</Section>
            <Section title="Mnemonic">{this.state.mnemonic}</Section>
            <Section title="C addr">{this.state.walletCAddress}</Section>
            <Section title="Evm addr bech">
              {this.state.walletEvmAddress}
            </Section>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

export default App;
