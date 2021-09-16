import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import Header from 'screens/mainView/Header';
import TextTitle from 'components/TextTitle';
import {ApplicationContext} from 'contexts/ApplicationContext';

export default function SwapView() {
  const context = useContext(ApplicationContext);
  return (
    <View style={[styles.container, {backgroundColor: context.theme.bgApp}]}>
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
