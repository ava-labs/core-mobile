import React from 'react';
import {StyleSheet, View} from 'react-native';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import {useApplicationContext} from 'contexts/ApplicationContext';
import MnemonicAva from 'screens/onboarding/MnemonicAva';
import AvaButton from 'components/AvaButton';
import CopySVG from 'components/svg/CopySVG';
import {copyToClipboard} from 'utils/DeviceTools';

type Props = {
  mnemonic: string;
};

export default function MnemonicScreen({mnemonic}: Props) {
  const {theme, isDarkMode} = useApplicationContext();

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
        style={[
          styles.mnemonics,
          {
            backgroundColor: isDarkMode ? theme.colorBg2 : theme.colorBg1,
          },
        ]}>
        {mnemonics()}
      </View>

      <View style={{alignSelf: 'flex-end', marginTop: 16}}>
        <AvaButton.TextWithIcon
          disabled={!mnemonic}
          onPress={() => copyToClipboard(mnemonic)}
          icon={<CopySVG />}
          text={
            <AvaText.ButtonMedium
              textStyle={{color: theme.alternateBackground}}>
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
