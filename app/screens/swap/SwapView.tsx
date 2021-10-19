import React from 'react';
import {StyleSheet, View} from 'react-native';
import Header from 'screens/mainView/Header';
import TextTitle from 'components/TextTitle';

export default function SwapView() {
  return (
    <View style={[styles.container]}>
      <Header />
      <TextTitle text={'Swap (TBD)'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    paddingBottom: 88,
  },
});
