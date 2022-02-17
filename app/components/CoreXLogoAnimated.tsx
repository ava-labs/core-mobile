import React, {FC} from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import CoreXAnimationDark from '../assets/lotties/corex_login_dark.json';
import CoreXAnimationLight from '../assets/lotties/corex_login_light.json';
import LottieView from 'lottie-react-native';
import isString from 'lodash.isstring';

const {width} = Dimensions.get('window');
const sizes = {
  small: 40,
  large: width / 3,
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

interface Props {
  size?: number | 'small' | 'large';
  white?: boolean;
}

const CoreXLogoAnimated: FC<Props> = ({size = 50, white}) => {
  let customSize = size;
  if (isString(size)) {
    customSize = sizes[size];
  }

  return (
    <View style={styles.container}>
      <View>
        <LottieView
          autoPlay
          loop={false}
          source={white ? CoreXAnimationLight : CoreXAnimationDark}
          style={{
            width: customSize,
            height: customSize,
          }}
        />
      </View>
    </View>
  );
};

export default CoreXLogoAnimated;
