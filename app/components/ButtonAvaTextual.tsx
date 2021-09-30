import React, {useContext} from 'react';
import {StyleSheet, TouchableNativeFeedback, View} from 'react-native';
import TextButtonTextual from 'components/TextButtonTextual';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  centered?: boolean;
};

export default function ButtonAvaTextual(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const theme = context.theme;
  return (
    <TouchableNativeFeedback
      disabled={props.disabled}
      useForeground={true}
      onPress={() => props.onPress()}
      background={TouchableNativeFeedback.Ripple(theme.buttonRipple, false)}>
      <View style={[styles.button]}>
        <TextButtonTextual
          disabled={props.disabled}
          text={props.text}
          centered={props.centered}
        />
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
  },
});
