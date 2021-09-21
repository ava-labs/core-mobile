import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import Header from 'screens/mainView/Header';
import TextTitle from 'components/TextTitle';
import Dot from 'components/Dot';
import TextLabel from 'components/TextLabel';
import PinKey, {PinKeys} from 'screens/onboarding/PinKey';
import {
  MnemonicLoaded,
  NothingToLoad,
  PrivateKeyLoaded,
  usePinOrBiometryLogin,
  WalletLoadingResults,
} from './PinOrBiometryLoginViewModel';
import {useWalletContext} from '@avalabs/wallet-react-components';
import {StackActions, useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AppViewModel from 'AppViewModel';

const keymap: Map<string, PinKeys> = new Map([
  ['1', PinKeys.Key1],
  ['2', PinKeys.Key2],
  ['3', PinKeys.Key3],
  ['4', PinKeys.Key4],
  ['5', PinKeys.Key5],
  ['6', PinKeys.Key6],
  ['7', PinKeys.Key7],
  ['8', PinKeys.Key8],
  ['9', PinKeys.Key9],
  ['0', PinKeys.Key0],
  ['<', PinKeys.Backspace],
]);

const PinOrBiometryLogin = () => {
  const {canGoBack, goBack, dispatch} = useNavigation();
  const [
    title,
    errorMessage,
    pinDots,
    onEnterPin,
    mnemonic,
    promptForWalletLoadingIfExists,
  ] = usePinOrBiometryLogin();

  const walletContext = useWalletContext();

  useEffect(() => {
    promptForWalletLoadingIfExists().subscribe({
      next: (value: WalletLoadingResults) => {
        if (value instanceof MnemonicLoaded) {
          AppViewModel.onEnterWallet(value.mnemonic)
            .then(() => walletContext?.setMnemonic(value.mnemonic))
            .then(() => navigateToApp());
        } else if (value instanceof PrivateKeyLoaded) {
          // props.onEnterSingletonWallet(value.privateKey)
        } else if (value instanceof NothingToLoad) {
          //do nothing
        }
      },
      error: err => console.log(err.message),
    });
  }, []);
  useEffect(() => {
    if (mnemonic) {
      AppViewModel.onEnterWallet(mnemonic)
        .then(() => walletContext?.setMnemonic(mnemonic))
        .then(() => navigateToApp());
    }
  }, [mnemonic]);

  const generatePinDots = (): Element[] => {
    const dots: Element[] = [];

    pinDots.forEach((value, key) => {
      dots.push(<Dot filled={value.filled} key={key} />);
    });
    return dots;
  };

  const keyboard = () => {
    const keys: Element[] = [];
    '123456789 0<'.split('').forEach((value, key) => {
      keys.push(
        <View key={key} style={styles.pinKey}>
          <PinKey keyboardKey={keymap.get(value)!} onPress={onEnterPin} />
        </View>,
      );
    });
    return keys;
  };

  const navigateToApp = () => {
    // navigate('App', {screen: 'Home'});
    dispatch(StackActions.replace('App', {screen: 'Home'}));
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.verticalLayout}>
        <Header showBack={canGoBack()} onBack={goBack} />
        <View style={[{height: 8}]} />

        <View style={styles.growContainer}>
          <TextTitle text={title} textAlign={'center'} bold size={24} />
          <TextTitle
            text={'Access your wallet faster'}
            size={16}
            textAlign={'center'}
          />
          <View style={[{height: 8}]} />

          {errorMessage.length > 0 && <TextLabel text={errorMessage} />}
          <View style={styles.dots}>{generatePinDots()}</View>
        </View>
        <View style={styles.keyboard}>{keyboard()}</View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  verticalLayout: {
    height: '100%',
    justifyContent: 'flex-end',
  },
  growContainer: {
    flexGrow: 1,
  },
  keyboard: {
    marginHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dots: {
    paddingHorizontal: 68,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexDirection: 'row',
  },
  pinKey: {
    flexBasis: '33%',
    padding: 16,
  },
});

export default PinOrBiometryLogin;
