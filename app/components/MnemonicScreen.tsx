import React from 'react';
import {StyleSheet, View} from 'react-native';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import {useApplicationContext} from 'contexts/ApplicationContext';
import MnemonicAva from 'screens/onboarding/MnemonicAva';
import Clipboard from '@react-native-clipboard/clipboard';
import {ShowSnackBar} from 'components/Snackbar';
import AvaButton from 'components/AvaButton';
import CopySVG from 'components/svg/CopySVG';

type Props = {
  mnemonic: string;
};

export default function MnemonicScreen({mnemonic}: Props) {
  const context = useApplicationContext();

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
    <View style={{flex: 1}}>
      <AvaText.Body1>
        Write down the recovery phrase and store it in a secure location.
      </AvaText.Body1>
      <Space y={24} />
      <View
        style={[styles.mnemonics, {backgroundColor: context.theme.colorBg1}]}>
        {mnemonics()}
      </View>

      <View style={{alignSelf: 'flex-end', marginTop: 16}}>
        <AvaButton.TextWithIcon
          disabled={!mnemonic}
          onPress={copyToClipboard}
          icon={<CopySVG />}
          text={
            <AvaText.ButtonMedium
              textStyle={{color: context.theme.alternateBackground}}>
              Copy Phrase
            </AvaText.ButtonMedium>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
