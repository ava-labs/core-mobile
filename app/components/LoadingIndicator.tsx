import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';

interface Props {
  size: number | 'small' | 'large';
}

function LoadingIndicator({size}: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

export default LoadingIndicator;
