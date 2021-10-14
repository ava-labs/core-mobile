import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {Space} from 'components/Space';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import AvaText from 'components/AvaText';

const pkg = require('../../../package.json');

export default function Splash(): JSX.Element {
  const context = useContext(ApplicationContext);

  return (
    <View
      style={[
        styles.verticalLayout,
        {backgroundColor: context.theme.colorBg1},
      ]}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <AvaLogoSVG
            logoColor={context.theme.colorPrimary1}
            backgroundColor={context.theme.transparent}
          />
        </View>
        <AvaText.LargeTitleBold textStyle={{textAlign: 'center'}}>
          Wallet
        </AvaText.LargeTitleBold>
        <Space y={8} />
        <AvaText.Body1 textStyle={{textAlign: 'center'}}>
          Your simple and secure crypto wallet
        </AvaText.Body1>
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
  buttonWithText: {
    alignItems: 'center',
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
