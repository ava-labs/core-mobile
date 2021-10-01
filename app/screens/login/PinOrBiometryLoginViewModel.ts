import {useEffect, useMemo, useRef, useState} from 'react';
import BiometricsSDK from 'utils/BiometricsSDK';
import {UserCredentials} from 'react-native-keychain';
import {PinKeys} from 'screens/onboarding/PinKey';
import {asyncScheduler, Observable, timer} from 'rxjs';
import {catchError, concatMap, map} from 'rxjs/operators';
import {Animated, Platform, Vibration} from 'react-native';

export type DotView = {
  filled: boolean;
};

const keymap: Map<PinKeys, string> = new Map([
  [PinKeys.Key1, '1'],
  [PinKeys.Key2, '2'],
  [PinKeys.Key3, '3'],
  [PinKeys.Key4, '4'],
  [PinKeys.Key5, '5'],
  [PinKeys.Key6, '6'],
  [PinKeys.Key7, '7'],
  [PinKeys.Key8, '8'],
  [PinKeys.Key9, '9'],
  [PinKeys.Key0, '0'],
]);

export function usePinOrBiometryLogin(): [
  string,
  DotView[],
  (pinKey: PinKeys) => void,
  string | undefined,
  () => Observable<WalletLoadingResults>,
  Animated.Value,
] {
  const [title] = useState('Wallet');
  const [enteredPin, setEnteredPin] = useState('');
  const [pinDots, setPinDots] = useState<DotView[]>([]);
  const [pinEntered, setPinEntered] = useState(false);
  const [mnemonic, setMnemonic] = useState<string | undefined>(undefined);
  const jiggleAnim = useRef(new Animated.Value(0)).current;

  const wrongPinAnim = useMemo(() => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(jiggleAnim, {
          toValue: 20,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(jiggleAnim, {
          toValue: -20,
          duration: 60,
          useNativeDriver: true,
        }),
      ]),
      {},
    );
  }, []);

  useEffect(() => {
    setPinDots(getPinDots(enteredPin));
  }, [enteredPin]);

  function resetConfirmPinProcess() {
    setEnteredPin('');
    setPinEntered(false);
    setMnemonic(undefined);
  }

  useEffect(() => {
    if (pinEntered) {
      BiometricsSDK.loadWalletWithPin().then(value => {
        if (value === false) {
          throw Error('Cannot load pin');
        }
        const credentials = value as UserCredentials;
        if (credentials.username === enteredPin) {
          setMnemonic(credentials.password);
        } else {
          resetConfirmPinProcess();
          fireJiggleAnimation();
          vibratePhone();
        }
      });
    }
  }, [pinEntered]);

  function vibratePhone() {
    Vibration.vibrate(
      Platform.OS === 'android'
        ? [0, 150, 10, 150, 10, 150, 10, 150, 10, 150]
        : [0, 10, 10, 10, 10],
    );
  }

  function fireJiggleAnimation() {
    wrongPinAnim.start();
    setTimeout(() => {
      wrongPinAnim.reset();
      jiggleAnim.setValue(0);
    }, 800);
  }

  const getPinDots = (pin: string): DotView[] => {
    const dots: DotView[] = [];
    for (let i = 0; i < 6; i++) {
      if (i < pin.length) {
        dots.push({filled: true});
      } else {
        dots.push({filled: false});
      }
    }
    return dots;
  };

  const onEnterPin = (pinKey: PinKeys): void => {
    if (pinKey === PinKeys.Backspace) {
      setEnteredPin(enteredPin.slice(0, -1));
    } else {
      if (enteredPin.length === 6) {
        return;
      }
      const newPin = enteredPin + keymap.get(pinKey)!;
      setEnteredPin(newPin);
      if (newPin.length === 6) {
        setPinEntered(true);
      }
    }
  };

  const promptForWalletLoadingIfExists =
    (): Observable<WalletLoadingResults> => {
      return timer(100, asyncScheduler).pipe(
        //timer is here to give UI opportunity to draw everything
        concatMap(() => BiometricsSDK.loadWalletKey(BiometricsSDK.loadOptions)),
        map(value => {
          if (value !== false) {
            const keyOrMnemonic = (value as UserCredentials).password;
            if (keyOrMnemonic.startsWith('PrivateKey')) {
              return new PrivateKeyLoaded(keyOrMnemonic);
            } else {
              setMnemonic(keyOrMnemonic);
              return new NothingToLoad();
            }
          } else {
            return new NothingToLoad();
          }
        }),
        catchError(err => {
          throw err;
        }),
      );
    };

  return [
    title,
    pinDots,
    onEnterPin,
    mnemonic,
    promptForWalletLoadingIfExists,
    jiggleAnim,
  ];
}

export interface WalletLoadingResults {}

export class MnemonicLoaded implements WalletLoadingResults {
  mnemonic: string;

  constructor(mnemonic: string) {
    this.mnemonic = mnemonic;
  }
}

export class PrivateKeyLoaded implements WalletLoadingResults {
  privateKey: string;

  constructor(privateKey: string) {
    this.privateKey = privateKey;
  }
}

export class NothingToLoad implements WalletLoadingResults {}
