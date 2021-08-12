import React, {useContext} from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  TouchableNativeFeedback,
  View,
} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  src: ImageSourcePropType;
  onPress: () => void;
  width?: number;
  height?: number;
};
export default function ImgButtonAva(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const theme = context.theme;
  return (
    <TouchableNativeFeedback
      useForeground={true}
      onPress={props.onPress}
      background={TouchableNativeFeedback.Ripple(theme.primaryColor, true)}>
      <View style={styles.container}>
        <Image
          source={props.src}
          style={[
            styles.button,
            {width: props.width || 24, height: props.height || 24},
          ]}
        />
      </View>
    </TouchableNativeFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'baseline',
  },
  button: {
    margin: 10,
  },
});
