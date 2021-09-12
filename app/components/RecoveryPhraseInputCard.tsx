import React, {useContext, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import TextTitle from 'components/TextTitle';
import InputText from './InputText';
import ButtonAva from './ButtonAva';
import ButtonAvaTextual from './ButtonAvaTextual';
import WalletSDK from '../utils/WalletSDK';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  onEnter: (mnemonic: string) => void;
  onCancel: () => void;
};

export default function RecoveryPhraseInputCard(
  props: Props | Readonly<Props>,
) {
  const context = useContext(ApplicationContext);

  const [enteredMnemonic, setEnteredMnemonic] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );

  const theme = context.theme;

  const onEnterWallet = (): void => {
    try {
      WalletSDK.getMnemonicValet(enteredMnemonic);
      props.onEnter(enteredMnemonic);
    } catch (e) {
      setErrorMessage('Invalid recovery phrase');
    }
  };

  const onEnterMnemonic = (text: string): void => {
    setErrorMessage(undefined);
    setEnteredMnemonic(text);
  };

  return (
    <View
      style={[
        context.shadow,
        styles.container,
        {
          height: 300,
          backgroundColor: theme.bgOnBgApp,
        },
      ]}>
      <View style={[{margin: 16}]}>
        <TextTitle text={'Recovery phrase'} size={18} bold />
      </View>
      <InputText
        onSubmit={onEnterWallet}
        minHeight={130}
        placeholder="Enter your recovery phrase"
        value={enteredMnemonic}
        multiline
        errorText={errorMessage}
        onChangeText={onEnterMnemonic}
      />
      <View style={[styles.buttonContainer]}>
        <View style={styles.horizontalLayout}>
          <ButtonAvaTextual text={'Cancel'} onPress={props.onCancel} />
          <ButtonAva text={'Enter'} onPress={onEnterWallet} size={'medium'} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    justifyContent: 'flex-end',
  },
  buttonContainer: {
    margin: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  horizontalLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
