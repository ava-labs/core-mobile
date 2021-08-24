import React, {useContext} from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface Props {
  network: string;
  active?: boolean;
  onNetworkSelected: () => void;
}

function NetworkCircle({network, active = false, onNetworkSelected}: Props) {
  const context = useContext(ApplicationContext);
  const isDarkMode = context.isDarkMode;

  function getBackgroundColor() {
    if (active) {
      return '#F1595A';
    }

    return isDarkMode ? '#3A3A3C' : '#F1F1F4';
  }

  return (
    <TouchableOpacity
      onPress={onNetworkSelected}
      style={[styles.circle, {backgroundColor: getBackgroundColor()}]}>
      <Text style={[styles.text, {color: active ? '#FFF' : '#6C6C6E'}]}>
        {network.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default NetworkCircle;
