import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';

export default function JailbrokenWarning({
  onOK,
}: {
  onOK: () => void;
}): JSX.Element {
  const context = useApplicationContext();

  return (
    <View
      style={[
        styles.verticalLayout,
        {backgroundColor: context.theme.colorBg2},
      ]}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <AvaText.Heading1>Jailbroken</AvaText.Heading1>
        </View>
      </View>
      <AvaButton.PrimaryLarge onPress={onOK}>Ok</AvaButton.PrimaryLarge>
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
