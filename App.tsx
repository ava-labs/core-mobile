/**
 * Avalanche Wallet App
 *
 * @format
 * @flow strict-local
 */

import React, {Component} from 'react';
import {
  Appearance,
  Button,
  SafeAreaView,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
} from 'react-native';
import Header from './src/mainView/Header';
import AppViewModel from './src/AppViewModel';
import Clock from './src/mainView/Clock';
import {Colors} from 'react-native/Libraries/NewAppScreen';

type AppProps = {};
type AppState = { 
  avaxPrice: number
  backgroundStyle: any
  mnemonic: string
  walletCAddress: string
  walletEvmAddress: string
  isDarkMode: boolean
  externalAddressesX: string[]
  externalAddressesP: string[]
  addressC: string
  availableX: string
};

class App extends Component<AppProps, AppState> {
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
      externalAddressesX: [],
      externalAddressesP: [],
      addressC: '',
      availableX: '',
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
    this.setState({mnemonic: this.viewModel.mnemonic});
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
    this.viewModel.externalAddressesX.subscribe(value => {
      this.setState({externalAddressesX: value});
    });
    this.viewModel.externalAddressesP.subscribe(value => {
      this.setState({externalAddressesP: value});
    });
    this.viewModel.addressC.subscribe(value => {
      this.setState({addressC: value});
    });
    this.viewModel.availableX.subscribe(value => {
      this.setState({availableX: value});
    });
  }
  render() {
    console.log('render');

    const sectionListData = [
      {
        title: 'Avax Price',
        data: ['$' + this.state.avaxPrice],
      },
      {
        title: 'Mnemonic',
        data: [this.state.mnemonic],
      },
      {
        title: 'External addresses X',
        data: [this.state.externalAddressesX],
      },
      {
        title: 'External addresses P',
        data: [this.state.externalAddressesP],
      },
      {
        title: 'External addresses C',
        data: [this.state.addressC],
      },
      {
        title: 'Available (X)',
        data: [this.state.availableX],
      },
    ];
    return (
      <SafeAreaView style={this.state.backgroundStyle}>
        <StatusBar
          barStyle={this.state.isDarkMode ? 'light-content' : 'dark-content'}
        />
        <Clock />
        <Header />
        <SectionList
          sections={sectionListData}
          renderItem={({item}) => (
            <Text
              style={[
                styles.item,
                {color: this.state.isDarkMode ? Colors.light : Colors.dark},
              ]}>
              {item}
            </Text>
          )}
          renderSectionHeader={({section}) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          keyExtractor={(item, index) => index}
        />
        <Button
          title={'Reset Hd indices'}
          onPress={() => this.viewModel.onResetHdIndices()}
        />
      </SafeAreaView>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 22,
  },
  sectionHeader: {
    paddingTop: 2,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 2,
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(247,247,247,1.0)',
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
});
export default App;
