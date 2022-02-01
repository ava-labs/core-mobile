import React from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';

interface Props {
  chain: string;
  active?: boolean;
  onChainSelected?: () => void;
  size?: number;
  textSize?: number;
}

function BlockchainCircle({
  chain,
  active = false,
  onChainSelected,
  size,
  textSize,
}: Props) {
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
      style={[
        styles.circle,
        {
          backgroundColor: getBackgroundColor(),
          width: size ?? 40,
          height: size ?? 40,
        },
      ]}>
      <Text
        style={[
          {
            color: active ? context.theme.txtOnBgApp : context.theme.txtOnBgApp,
            fontSize: textSize ?? 16,
          },
        ]}>
        {chain.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: 2000,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BlockchainCircle;
