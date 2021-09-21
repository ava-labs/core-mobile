import React, {useEffect, useState} from 'react';
import {Alert, ScrollView, StyleSheet, View} from 'react-native';
import TextTitle from 'components/TextTitle';
import ButtonAva from 'components/ButtonAva';
import CheckMnemonicViewModel from './CheckMnemonicViewModel';
import {Subscription} from 'rxjs';
import HeaderProgress from 'screens/mainView/HeaderProgress';
import MnemonicAva from 'screens/onboarding/MnemonicAva';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import AppViewModel from 'AppViewModel';
import AvaNavigation from 'navigation/AvaNavigation';

export default function CheckMnemonic() {
  const mnemonic = AppViewModel.mnemonic;
  const [viewModel] = useState(new CheckMnemonicViewModel(mnemonic ?? ''));
  const [enteredMnemonics, setEnteredMnemonics] = useState(new Map());
  const [enabledInputs, setEnabledInputs] = useState(new Map());
  const {goBack, navigate} = useNavigation();

  useEffect(() => {
    const disposables = new Subscription();
    disposables.add(
      viewModel.enteredMnemonic.subscribe(value => setEnteredMnemonics(value)),
    );
    disposables.add(
      viewModel.enabledInputs.subscribe(value => setEnabledInputs(value)),
    );
    viewModel.onComponentMount();

    return () => {
      disposables.unsubscribe();
    };
  }, []);

  const onBack = () => {
    goBack();
  };

  const navigateToCreatePin = () => {
    navigate(AvaNavigation.CreateWallet.CreatePin);
  };

  const onVerify = (): void => {
    viewModel.onVerify().subscribe({
      error: err => Alert.alert(err.message),
      complete: navigateToCreatePin,
    });
  };

  const setMnemonic = (index: number, value: string): void => {
    viewModel.setMnemonic(index, value);
  };

  const mnemonics = () => {
    const mnemonics: Element[] = [];
    enteredMnemonics.forEach((value, key) => {
      if (enabledInputs.get(key)) {
        mnemonics.push(
          <MnemonicAva.Input
            key={key}
            keyNum={key}
            text={value}
            onChangeText={text => setMnemonic(key, text)}
          />,
        );
      } else {
        mnemonics.push(
          <MnemonicAva.Text key={key} keyNum={key} text={value} />,
        );
      }
    });
    return mnemonics;
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <HeaderProgress maxDots={3} filledDots={2} showBack onBack={onBack} />
        <TextTitle
          text={'Fill In Mnemonic Phrase Below'}
          size={20}
          textAlign={'center'}
        />
        <View style={[{height: 16}]} />
        <View style={styles.growContainer}>
          <View style={styles.mnemonics}>{mnemonics()}</View>
        </View>
        <ButtonAva text={'Next'} onPress={onVerify} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles: any = StyleSheet.create({
  scrollView: {
    height: '100%',
  },
  mnemonics: {
    marginHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  growContainer: {
    flexGrow: 1,
  },
  horizontalLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
});
