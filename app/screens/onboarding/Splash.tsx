import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import LottieView from 'lottie-react-native';
import SplashLogoSVG from 'components/svg/SplashLogoSVG';

const pkg = require('../../../package.json');

export default function Splash({finished}: {finished?: boolean}): JSX.Element {
  const context = useApplicationContext();

  return (
    <View
      style={[
        styles.verticalLayout,
        {backgroundColor: context.theme.colorBg2},
      ]}>
      <LottieView
        source={require('../../assets/lotties/corex_login_dark.json')}
        progress={finished ? 1 : 0}
        autoPlay={!finished}
        loop={false}
      />

      <AvaText.Body2 textStyle={{position: 'absolute', top: 0, left: 16}}>
        v{pkg.version}
      </AvaText.Body2>
    </View>
  );
}

const styles = StyleSheet.create({
  verticalLayout: {
    padding: 16,
    height: '100%',
    justifyContent: 'flex-end',
  },
  logoContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
  },
});
