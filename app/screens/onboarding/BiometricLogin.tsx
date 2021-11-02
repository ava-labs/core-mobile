import React, {useContext} from 'react';
import {Alert, Image, StyleSheet, View} from 'react-native';
import TextLabel from 'components/TextLabel';
import {useBiometricLogin} from './BiometricLoginViewModel';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Space} from 'components/Space';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';

type Props = {
  mnemonic: string;
  onSkip: () => void;
  onBiometrySet: () => void;
};

export default function BiometricLogin(
  props: Props | Readonly<Props>,
): JSX.Element {
  const context = useApplicationContext();

  const [biometryType, onUseBiometry, fingerprintIcon] = useBiometricLogin(
    props.mnemonic,
    context.isDarkMode,
  );

  async function handleUseBiometry() {
    try {
      await onUseBiometry();
      props.onBiometrySet();
    } catch (e: any) {
      Alert.alert(e?.message || 'error');
    }
  }

  return (
    <View style={styles.verticalLayout}>
      <View style={styles.centerLayout}>
        <Image
          source={fingerprintIcon}
          style={[
            {
              width: 120,
              height: 120,
            },
          ]}
        />
        <Space y={90} />
        <AvaText.Heading1>Biometric Login</AvaText.Heading1>
        <Space y={8} />

        <AvaText.Body4
          textStyle={{
            textAlign: 'center',
            alignSelf: 'stretch',
            paddingRight: 8,
            paddingLeft: 8,
          }}>
          Sign in quickly using your {biometryType?.toLowerCase()}. Change this
          anytime in settings
        </AvaText.Body4>
      </View>

      <AvaButton.TextMedium onPress={props.onSkip}>Skip</AvaButton.TextMedium>
      <Space y={16} />
      <AvaButton.PrimaryLarge onPress={handleUseBiometry}>
        {'Use ' + biometryType?.toLowerCase()}
      </AvaButton.PrimaryLarge>
    </View>
  );
}

const styles = StyleSheet.create({
  verticalLayout: {
    padding: 16,
    justifyContent: 'flex-end',
    height: '100%',
  },
  centerLayout: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
