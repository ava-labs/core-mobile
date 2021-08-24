import React from 'react';
import {StyleSheet, View} from 'react-native';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#DEDEDE',
    height: 1,
  },
});
const Separator = () => {
  return <View style={styles.container} />;
};

export default Separator;
