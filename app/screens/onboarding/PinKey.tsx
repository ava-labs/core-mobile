import React, {useContext} from 'react';
import {StyleSheet, Text, TouchableNativeFeedback, View} from 'react-native';
import {ApplicationContext} from 'contexts/applicationContext';

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
  const context = useContext(ApplicationContext);
  const theme = context.theme;
  return (
    <TouchableNativeFeedback
      useForeground={true}
      onPress={() => props.onPress(props.keyboardKey)}
      background={TouchableNativeFeedback.Ripple(theme.buttonRipple, true)}>
      <View style={[styles.button]}>
        <Text
          style={[
            {
              color: theme.textOnBg,
              fontFamily: 'Inter-Regular',
              fontSize: 36,
              lineHeight: 44,
              fontWeight: '400',
            },
          ]}>
          {keymap.get(props.keyboardKey)}
        </Text>
      </View>
    </TouchableNativeFeedback>
  );
}

const styles: any = StyleSheet.create({
  button: {
    alignItems: 'center',
    width: '100%',
  },
});
