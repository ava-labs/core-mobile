import React from 'react';
import {StyleSheet, View} from 'react-native';
import ZeroState from 'components/ZeroState';

export default function WatchlistView(): JSX.Element {
  return (
    <View style={[styles.container]}>
      <ZeroState.ComingSoon />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
});
