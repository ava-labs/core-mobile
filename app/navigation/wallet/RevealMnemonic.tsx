import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaButton from 'components/AvaButton';
import {useNavigation} from '@react-navigation/native';
import MnemonicScreen from 'components/MnemonicScreen';

export default function RevealMnemonic(): JSX.Element {
  const context = useApplicationContext();
  const {goBack} = useNavigation();
  const {mnemonic} = context.appHook;

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
