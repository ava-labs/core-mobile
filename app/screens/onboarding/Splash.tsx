import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import SplashLogoSVG from 'components/svg/SplashLogoSVG';

const pkg = require('../../../package.json');

export default function Splash(): JSX.Element {
  const context = useApplicationContext();

  return (
    <View
      style={[
        styles.verticalLayout,
        {backgroundColor: context.theme.colorBg2},
      ]}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <SplashLogoSVG />
        </View>
      </View>

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
