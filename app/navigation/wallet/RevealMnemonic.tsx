import React from 'react';
import {StyleSheet, View} from 'react-native';
import AvaButton from 'components/AvaButton';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import MnemonicScreen from 'components/MnemonicScreen';
import {SecurityStackParamList} from 'navigation/wallet/SecurityPrivacyStackScreen';

export default function RevealMnemonic(): JSX.Element {
  const {goBack} = useNavigation();
  const {mnemonic} = useRoute<RouteProp<SecurityStackParamList>>().params!;

  const handleSaveMyPhrase = (): void => {
    goBack();
  };

  return (
    <View style={styles.verticalLayout}>
      {/* This serves as grouping so we can achieve desired behavior with `justifyContent: 'space-between'`   */}
      <MnemonicScreen mnemonic={mnemonic} />

      {/* This serves as grouping so we can achieve desired behavior with `justifyContent: 'space-between'`   */}
      <View style={{marginTop: 28, marginBottom: 40}}>
        <AvaButton.PrimaryLarge
          disabled={!mnemonic}
          onPress={handleSaveMyPhrase}>
          I wrote it down
        </AvaButton.PrimaryLarge>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  verticalLayout: {
    flex: 1,
    marginHorizontal: 16,
  },
});
