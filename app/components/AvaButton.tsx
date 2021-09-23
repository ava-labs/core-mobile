import React, {FC, useContext} from 'react';
import {StyleSheet, TouchableNativeFeedback, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface BaseProps {
  onPress: () => void;
  style?: any;
}

const AvaButtonBase: FC<BaseProps> = ({onPress, style, children}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <TouchableNativeFeedback
      useForeground={true}
      onPress={onPress}
      background={TouchableNativeFeedback.Ripple(theme.buttonRipple, true)}>
      <View style={[styles.button, style]}>{children}</View>
    </TouchableNativeFeedback>
  );
};

const AvaButtonIcon: FC<BaseProps> = ({onPress, children}) => {
  return (
    <AvaButtonBase onPress={onPress} style={styles.buttonIcon}>
      {children}
    </AvaButtonBase>
  );
};

const AvaButton = {
  Base: AvaButtonBase,
  Icon: AvaButtonIcon,
};

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
  buttonIcon: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
});

export default AvaButton;
