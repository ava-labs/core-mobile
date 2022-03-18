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
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';

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
      <AvaText.LargeTitleBold>Recovery Phrase</AvaText.LargeTitleBold>
      <Space y={20} />
      {isLoading ? (
        <ActivityIndicator
          style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
          size="large"
        />
      ) : (
        <MnemonicScreen mnemonic={localMnemonic} />
      )}

      <AvaButton.PrimaryLarge
        disabled={!localMnemonic}
        onPress={handleSaveMyPhrase}>
        I wrote it down
      </AvaButton.PrimaryLarge>
    </View>
  );
}

const styles = StyleSheet.create({
  verticalLayout: {
    flex: 1,
    marginHorizontal: 16,
    paddingBottom: 40,
  },
});
