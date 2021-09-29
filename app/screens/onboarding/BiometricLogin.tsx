import React, {useContext} from 'react';
import {Alert, Image, StyleSheet, View} from 'react-native';
import TextLabel from 'components/TextLabel';
import {useBiometricLogin} from './BiometricLoginViewModel';
import {ApplicationContext} from 'contexts/ApplicationContext';
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
  const context = useContext(ApplicationContext);

  const [biometryType, onUseBiometry, fingerprintIcon] = useBiometricLogin(
    props.mnemonic,
    context.isDarkMode,
  );

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
        <TextLabel
          text={'Sign in quickly using your ' + biometryType?.toLowerCase()}
        />
        <TextLabel text={'Change this anytime in settings'} />
      </View>

      <AvaButton.TextMedium onPress={props.onSkip}>Skip</AvaButton.TextMedium>
      <Space y={16} />
      <AvaButton.PrimaryLarge
        onPress={() => {
          onUseBiometry().subscribe({
            error: err => Alert.alert(err?.message || 'error'),
            complete: () => props.onBiometrySet(),
          });
        }}>
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
