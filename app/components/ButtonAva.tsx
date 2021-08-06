import React, {useState} from 'react';
import {
  Appearance,
  StyleSheet,
  TouchableNativeFeedback,
  View,
} from 'react-native';
import CommonViewModel from 'utils/CommonViewModel';
import {COLORS, COLORS_NIGHT} from '../resources/Constants';
import TextButton from './TextButton';

type Props = {
  text: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function ButtonAva(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(
    new CommonViewModel(Appearance.getColorScheme()),
  );
  const [isDarkMode] = useState(commonViewModel.isDarkMode);

  const THEME = isDarkMode ? COLORS_NIGHT : COLORS;
  return (
    <TouchableNativeFeedback
      disabled={props.disabled}
      useForeground={true}
      onPress={() => props.onPress()}
      background={TouchableNativeFeedback.Ripple(THEME.buttonRipple, false)}>
      <View
        style={[
          styles.button,
          {
            backgroundColor: props.disabled
              ? THEME.buttonPrimaryDisabled
              : THEME.buttonPrimary,
          },
        ]}>
        <TextButton disabled={props.disabled} text={props.text} />
      </View>
    </TouchableNativeFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginHorizontal: 24,
    marginVertical: 8,
    borderRadius: 8,
  },
});
