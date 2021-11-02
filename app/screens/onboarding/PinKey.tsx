import React, {useContext} from 'react';
import {
  ColorValue,
  Image,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  View,
} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';

export enum PinKeys {
  Key1,
  Key2,
  Key3,
  Key4,
  Key5,
  Key6,
  Key7,
  Key8,
  Key9,
  Key0,
  Backspace,
}

type Props = {
  keyboardKey: PinKeys;
  onPress: (key: PinKeys) => void;
};

const keymap: Map<PinKeys, string> = new Map([
  [PinKeys.Key1, '1'],
  [PinKeys.Key2, '2'],
  [PinKeys.Key3, '3'],
  [PinKeys.Key4, '4'],
  [PinKeys.Key5, '5'],
  [PinKeys.Key6, '6'],
  [PinKeys.Key7, '7'],
  [PinKeys.Key8, '8'],
  [PinKeys.Key9, '9'],
  [PinKeys.Key0, '0'],
  [PinKeys.Backspace, '<'],
]);

export default function PinKey(props: Props | Readonly<Props>) {
  const context = useApplicationContext();
  const theme = context.theme;
  const isBackspace = props.keyboardKey === PinKeys.Backspace;
  if (props.keyboardKey === undefined) {
    return <View />;
  }
  return (
    <TouchableNativeFeedback
      useForeground={true}
      onPress={() => props.onPress(props.keyboardKey)}
      background={TouchableNativeFeedback.Ripple(theme.buttonRipple, true)}>
      <View style={[styles.button]}>
        {isBackspace && Backspace(context.isDarkMode)}
        {!isBackspace && Digit(props.keyboardKey, theme.txtOnBgApp)}
      </View>
    </TouchableNativeFeedback>
  );
}

const Digit = (key: PinKeys, color: ColorValue) => {
  return (
    <Text
      style={[
        {
          color: color,
          fontFamily: 'Inter-Regular',
          fontSize: 36,
          lineHeight: 44,
        },
      ]}>
      {keymap.get(key)}
    </Text>
  );
};

const Backspace = (isDarkMode: boolean) => {
  const backspaceIcon = isDarkMode
    ? require('assets/icons/backspace_dark.png')
    : require('assets/icons/backspace_light.png');
  return <Image source={backspaceIcon} style={[{width: 24, height: 24}]} />;
};

const styles: any = StyleSheet.create({
  button: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});
