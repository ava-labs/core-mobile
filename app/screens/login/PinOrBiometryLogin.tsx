import React, {useEffect} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import Dot from 'components/Dot';
import PinKey, {PinKeys} from 'screens/onboarding/PinKey';
import {
  MnemonicLoaded,
  NothingToLoad,
  PrivateKeyLoaded,
  usePinOrBiometryLogin,
  WalletLoadingResults,
} from './PinOrBiometryLoginViewModel';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaButton from 'components/AvaButton';
import OwlLogoSVG from 'components/svg/OwlLogoSVG';

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

type Props = {
  onSignInWithRecoveryPhrase: () => void;
  onLoginSuccess: (mnemonic: string) => void;
  isResettingPin?: boolean;
  hideLoginWithMnemonic?: boolean;
};

/**
 * This screen will select appropriate login method (pin or biometry) and call onLoginSuccess upon successful login.
 * @param onSignInWithRecoveryPhrase
 * @param onLoginSuccess
 * @param isResettingPin
 * @param hideLoginWithMnemonic
 * @constructor
 */
export default function PinOrBiometryLogin({
  onSignInWithRecoveryPhrase,
  onLoginSuccess,
  isResettingPin,
  hideLoginWithMnemonic = false,
}: Props | Readonly<Props>): JSX.Element {
  const theme = useApplicationContext().theme;

  const [
    title,
    pinDots,
    onEnterPin,
    mnemonic,
    promptForWalletLoadingIfExists,
    jiggleAnim,
  ] = usePinOrBiometryLogin();

  const context = useApplicationContext();

  useEffect(() => {
    // check if if the login is biometric
    promptForWalletLoadingIfExists().subscribe({
      next: (value: WalletLoadingResults) => {
        if (value instanceof MnemonicLoaded) {
          // do nothing. We only rely on `setMnemonic` being called
          // and the useEffect being triggered.
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
      onLoginSuccess(mnemonic);
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

  return (
    <View style={[styles.verticalLayout, {backgroundColor: theme.background}]}>
      <Space y={64} />
      <View style={styles.growContainer}>
        {isResettingPin || (
          <View style={{alignItems: 'center'}}>
            <OwlLogoSVG />
            <Space y={8} />
            <AvaText.Body1
              textStyle={{
                color: context.theme.colorText1,
              }}>
              Enter your PIN
            </AvaText.Body1>
          </View>
        )}
        <Animated.View
          style={[
            {padding: 68},
            {
              transform: [
                {
                  translateX: jiggleAnim,
                },
              ],
            },
          ]}>
          <View style={styles.dots}>{generatePinDots()}</View>
        </Animated.View>
      </View>
      <View style={styles.keyboard}>{keyboard()}</View>
      {isResettingPin || hideLoginWithMnemonic || (
        <>
          <AvaButton.TextMedium onPress={onSignInWithRecoveryPhrase}>
            Sign In with recovery phrase
          </AvaButton.TextMedium>
          <Space y={16} />
        </>
      )}
    </View>
  );
}

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
    marginBottom: 32,
  },
  dots: {
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
