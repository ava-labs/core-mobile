import React, {useContext} from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';

interface Props {
  chain: string;
  active?: boolean;
  onChainSelected: () => void;
}

function BlockchainCircle({chain, active = false, onChainSelected}: Props) {
  const context = useApplicationContext();

  function getBackgroundColor() {
    if (active) {
      return context.theme.accentColor;
    }

    return context.theme.bgSearch;
  }

  return (
    <TouchableOpacity
      onPress={onChainSelected}
      style={[styles.circle, {backgroundColor: getBackgroundColor()}]}>
      <Text
        style={[
          {
            color: active ? context.theme.txtOnBgApp : context.theme.txtOnBgApp,
          },
        ]}>
        {chain.toUpperCase()}
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

export default BlockchainCircle;
