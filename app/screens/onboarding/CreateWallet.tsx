import React, {useContext, useState} from 'react';
import {Image, StyleSheet, ToastAndroid, View} from 'react-native';
import CreateWalletViewModel from './CreateWalletViewModel';
import TextTitle from 'components/TextTitle';
import ButtonAva from 'components/ButtonAva';
import Clipboard from '@react-native-clipboard/clipboard';
import ButtonAvaTextual from 'components/ButtonAvaTextual';
import {ApplicationContext} from 'contexts/ApplicationContext';
import HeaderProgress from 'screens/mainView/HeaderProgress';
import MnemonicAva from 'screens/onboarding/MnemonicAva';

type Props = {
  onBack: () => void;
  onSavedMyPhrase: (mnemonic: string) => void;
};

export default function CreateWallet(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const [viewModel] = useState(new CreateWalletViewModel());
  const [mnemonic] = useState(viewModel.mnemonic);

  const onBack = (): void => {
    props.onBack();
  };

  const onSavedMyPhrase = (): void => {
    props.onSavedMyPhrase(viewModel.mnemonic);
  };

  const copyToClipboard = (): void => {
    Clipboard.setString(mnemonic);
    ToastAndroid.show('Copied', 1000);
  };

  const BalloonText = () => {
    const theme = context.theme;
    const balloonArrow = context.isDarkMode
      ? require('assets/icons/balloon_arrow_dark.png')
      : require('assets/icons/balloon_arrow_light.png');
    const warningIcon = context.isDarkMode
      ? require('assets/icons/warning_dark.png')
      : require('assets/icons/warning_light.png');
    return (
      <View style={[{marginTop: 24, alignItems: 'center'}]}>
        <View
          style={[
            {
              flexDirection: 'row',
              backgroundColor: theme.toastBgWarning,
              alignItems: 'center',
              borderRadius: 8,
              padding: 16,
            },
          ]}>
          <Image
            source={warningIcon}
            style={[{width: 32, height: 32, marginRight: 12}]}
          />
          <View style={[{flex: 1}]}>
            <TextTitle
              color={theme.toastTxt}
              text={
                'The recovery phrase is the only key to your wallet. Do not share it with anyone.'
              }
              lineHeight={17}
              size={14}
            />
          </View>
        </View>
        <Image source={balloonArrow} />
      </View>
    );
  };

  const mnemonics = () => {
    const mnemonics: Element[] = [];
    mnemonic.split(' ').forEach((value, key) => {
      mnemonics.push(<MnemonicAva.Text key={key} keyNum={key} text={value} />);
    });
    return mnemonics;
  };

  return (
    <View style={styles.verticalLayout}>
      <HeaderProgress maxDots={3} filledDots={1} showBack onBack={onBack} />
      <View style={[{height: 8}]} />

      <View style={styles.growContainer}>
        <TextTitle
          text={'Recovery Phrase'}
          textAlign={'center'}
          bold
          size={24}
        />
        <View style={[{height: 8}]} />
        <TextTitle
          text={
            'Write down the recovery phrase and store it in a secure location!'
          }
          size={16}
          lineHeight={24}
          textAlign={'center'}
        />
        <BalloonText />
        <View style={[{height: 8}]} />
        <View
          style={[
            styles.mnemonics,
            {backgroundColor: context.theme.bgOnBgApp},
          ]}>
          {mnemonics()}
        </View>
      </View>

      <ButtonAvaTextual text={'Copy phrase'} onPress={copyToClipboard} />
      <ButtonAva text={'Next'} onPress={onSavedMyPhrase} />
    </View>
  );
}

const styles = StyleSheet.create({
  verticalLayout: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  growContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mnemonics: {
    paddingStart: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
