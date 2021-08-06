import React, {useState} from 'react';
import {
  Appearance,
  StyleSheet,
  TouchableNativeFeedback,
  View,
} from 'react-native';
import CommonViewModel from 'utils/CommonViewModel';
import {COLORS, COLORS_NIGHT} from 'resources/Constants';
import TextButtonSecondary from 'components/TextButtonSecondary';

type Props = {
  text: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function ButtonAvaSecondary(props: Props | Readonly<Props>) {
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
      background={TouchableNativeFeedback.Ripple(
        THEME.buttonRippleSecondary,
        false,
      )}>
      <View
        style={[
          styles.button,
          {
            backgroundColor: THEME.transparent,
            borderColor: THEME.buttonSecondary,
          },
        ]}>
        <TextButtonSecondary disabled={props.disabled} text={props.text} />
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
    borderWidth: 2,
    borderRadius: 8,
  },
});
