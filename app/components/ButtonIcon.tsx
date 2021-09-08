import React, {useContext} from 'react';
import {StyleSheet, TouchableNativeFeedback, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import TextButtonTextual from 'components/TextButtonTextual';

type Props = {
  onPress: () => void;
  children: any;
};

export default function ButtonIcon(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const theme = context.theme;

  return (
    <TouchableNativeFeedback
      useForeground={true}
      onPress={() => props.onPress()}
      background={TouchableNativeFeedback.Ripple(theme.buttonRipple, false)}>
      <View style={[styles.button]}>{props.children}</View>
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
    borderRadius: 8,
  },
});
