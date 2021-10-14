import React, {useContext, useEffect, useState} from 'react';
import {Image, Platform, StyleSheet, ToastAndroid, View} from 'react-native';
import CreateWalletViewModel from './CreateWalletViewModel';
import TextTitle from 'components/TextTitle';
import Clipboard from '@react-native-clipboard/clipboard';
import {ApplicationContext} from 'contexts/ApplicationContext';
import HeaderProgress from 'screens/mainView/HeaderProgress';
import MnemonicAva from 'screens/onboarding/MnemonicAva';
import AvaButton from 'components/AvaButton';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import AppViewModel from 'AppViewModel';

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
  const context = useContext(ApplicationContext);
  const [viewModel] = useState(new CreateWalletViewModel());
  const [mnemonic] = useState(
    isRevealingCurrentMnemonic ? AppViewModel.mnemonic : viewModel.mnemonic,
  );

  const handleSaveMyPhrase = (): void => {
    if (isRevealingCurrentMnemonic) {
      onBack();
    } else {
      onSavedMyPhrase?.(viewModel.mnemonic);
    }
  };

  const copyToClipboard = (): void => {
    Clipboard.setString(mnemonic);
    Platform.OS === 'android' && ToastAndroid.show('Copied', 1000);
  };

  const BalloonText = () => {
    if (isRevealingCurrentMnemonic) {
      return null;
    }

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
      <View>
        <AvaText.Body1 textStyle={{textAlign: 'center'}}>
          Write down the recovery phrase and store it in a secure location!
        </AvaText.Body1>
        <BalloonText />
        <Space y={8} />
        <View
          style={[
            styles.mnemonics,
            {backgroundColor: context.theme.bgOnBgApp},
          ]}>
          {mnemonics()}
        </View>
      </View>

      {/* This serves as grouping so we can achieve desired behavior with `justifyContent: 'space-between'`   */}
      <View>
        <AvaButton.TextLarge onPress={copyToClipboard}>
          Copy phrase
        </AvaButton.TextLarge>
        <AvaButton.PrimaryLarge
          style={{marginTop: 28, marginBottom: 40}}
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
    justifyContent: 'space-between',
  },
  growContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mnemonics: {
    paddingStart: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
