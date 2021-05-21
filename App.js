/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import type {Node} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  useColorScheme,
  View,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import {MnemonicWallet} from './wallet_sdk';
import Section from './src/mainView/Section';
import Header from './src/mainView/Header';

const App: () => Node = () => {
  const isDarkMode = useColorScheme() === 'dark';

  let mnemonic = MnemonicWallet.generateMnemonicPhrase();

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Section title="Generated mnemonic">{mnemonic}</Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;
