import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  InteractionManager,
  StyleSheet,
  View,
} from 'react-native';
import AvaButton from 'components/AvaButton';
import WalletSDK from 'utils/WalletSDK';
import MnemonicScreen from 'components/MnemonicScreen';

type Props = {
  onSavedMyPhrase?: (mnemonic: string) => void;
};

export default function CreateWallet({onSavedMyPhrase}: Props): JSX.Element {
  const [localMnemonic, setLocalMnemonic] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      (async () => {
        const newPhrase = await WalletSDK.generateMnemonic();
        setLocalMnemonic(newPhrase);
        setIsLoading(false);
      })();
    });
  }, []);

  const handleSaveMyPhrase = (): void => {
    onSavedMyPhrase?.(localMnemonic);
  };

  return (
    <View style={styles.verticalLayout}>
      {/* This serves as grouping so we can achieve desired behavior with `justifyContent: 'space-between'`   */}
      <View style={{flex: 1}}>
        {isLoading ? (
          <ActivityIndicator
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
            size="large"
          />
        ) : (
          <MnemonicScreen mnemonic={localMnemonic} />
        )}
      </View>

      {/* This serves as grouping so we can achieve desired behavior with `justifyContent: 'space-between'`   */}
      <View>
        <AvaButton.PrimaryLarge
          style={{marginTop: 28, marginBottom: 40}}
          disabled={!localMnemonic}
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
