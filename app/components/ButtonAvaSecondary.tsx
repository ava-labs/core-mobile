import React, {useContext} from 'react';
import {StyleSheet, TouchableNativeFeedback, View} from 'react-native';
import TextButtonSecondary from 'components/TextButtonSecondary';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  size?: 'large' | 'medium' | 'small';
};

export default function ButtonAvaSecondary(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const theme = context.theme;
  const size = props.size || 'large';
  let width: string | number = 'auto';
  let height: number = 48;
  switch (size) {
    case 'large':
      width = 'auto';
      height = 48;
      break;
    case 'medium':
      width = 140;
      height = 40;
      break;
    case 'small':
      width = 90;
      height = 32;
      break;
  }
  return (
    <TouchableNativeFeedback
      disabled={props.disabled}
      useForeground={true}
      onPress={() => props.onPress()}
      background={TouchableNativeFeedback.Ripple(
        theme.buttonRippleSecondary,
        false,
      )}>
      <View
        style={[
          styles.button,
          {
            backgroundColor: theme.transparent,
            borderColor: theme.buttonSecondary,
            width: width,
            height: height,
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
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 2,
    borderRadius: 8,
  },
});
