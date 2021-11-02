import React, {useContext, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  InteractionManager,
  StyleSheet,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {useApplicationContext} from 'contexts/ApplicationContext';
import HeaderProgress from 'screens/mainView/HeaderProgress';
import MnemonicAva from 'screens/onboarding/MnemonicAva';
import AvaButton from 'components/AvaButton';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import AppViewModel from 'AppViewModel';
import {ShowSnackBar} from 'components/Snackbar';
import WalletSDK from 'utils/WalletSDK';

type Props = {
  onBack: () => void;
  onSavedMyPhrase?: (mnemonic: string) => void;
  isRevealingCurrentMnemonic?: boolean;
};

export default function CreateWallet({
  onBack,
  onSavedMyPhrase,
  isRevealingCurrentMnemonic,
}: Props): JSX.Element {
  const context = useApplicationContext();
  const [mnemonic, setMnemonic] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      if (isRevealingCurrentMnemonic) {
        setMnemonic(AppViewModel.mnemonic);
        setIsLoading(false);
      } else {
        (async () => {
          const newPhrase = await WalletSDK.generateMnemonic();
          setMnemonic(newPhrase);
          setIsLoading(false);
        })();
      }
    });
  }, []);

  const handleSaveMyPhrase = (): void => {
    if (isRevealingCurrentMnemonic) {
      onBack();
    } else {
      onSavedMyPhrase?.(mnemonic);
    }
  };

  const copyToClipboard = (): void => {
    Clipboard.setString(mnemonic);
    ShowSnackBar('Copied');
  };

  const mnemonics = () => {
    const mnemonics: Element[] = [];
    mnemonic?.split(' ').forEach((value, key) => {
      mnemonics.push(<MnemonicAva.Text key={key} keyNum={key} text={value} />);
    });
    return mnemonics;
  };

  return (
    <View style={styles.verticalLayout}>
      {isRevealingCurrentMnemonic || (
        <>
          <HeaderProgress maxDots={3} filledDots={1} showBack onBack={onBack} />
          <Space y={8} />
          <AvaText.Heading1 textStyle={{textAlign: 'center'}}>
            Recovery Phrase
          </AvaText.Heading1>
          <Space y={8} />
        </>
      )}
      {/* This serves as grouping so we can achieve desired behavior with `justifyContent: 'space-between'`   */}
      <View style={{flex: 1}}>
        {isLoading ? (
          <ActivityIndicator
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
            size="large"
          />
        ) : (
          <>
            <AvaText.Body1 textStyle={{textAlign: 'center'}}>
              Write down the recovery phrase and store it in a secure location!
            </AvaText.Body1>
            <Space y={32} />
            <View
              style={[
                styles.mnemonics,
                {backgroundColor: context.theme.bgOnBgApp},
              ]}>
              {mnemonics()}
            </View>
          </>
        )}
      </View>

      {/* This serves as grouping so we can achieve desired behavior with `justifyContent: 'space-between'`   */}
      <View>
        <AvaButton.TextLarge disabled={!mnemonic} onPress={copyToClipboard}>
          Copy phrase
        </AvaButton.TextLarge>
        <AvaButton.PrimaryLarge
          style={{marginTop: 28, marginBottom: 40}}
          disabled={!mnemonic}
          onPress={handleSaveMyPhrase}>
          {isRevealingCurrentMnemonic ? 'Done' : 'Next'}
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
  growContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mnemonics: {
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'column',
    flex: 1,
    flexWrap: 'wrap',
    marginTop: 8,
    maxHeight: 280,
    alignContent: 'center',
  },
});
