import {asyncScheduler, AsyncSubject, concat, from, Observable, of} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {BackHandler} from 'react-native';
import BiometricsSDK from 'utils/BiometricsSDK';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SECURE_ACCESS_SET} from 'resources/Constants';
import {encrypt, getEncryptionKey} from 'screens/login/utils/EncryptionHelper';
import {
  Dispatch,
  MutableRefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {NavigationContainerRef} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';

export type AppHook = {
  shouldSetupWallet: boolean;
  onEnterWallet: (m?: string) => void;
  onExit: () => Observable<ExitEvents>;
  onSavedMnemonic: (mnemonic: string, isResetting?: boolean) => void;
  selectedCurrency: string;
  resetNavToEnterMnemonic: (
    navigation: MutableRefObject<NavigationContainerRef<any> | undefined>,
  ) => void;
  onPinCreated: (pin: string, isResetting?: boolean) => Observable<boolean>;
  isNewWallet: boolean;
  immediateLogout: () => Promise<void>;
  setSelectedCurrency: Dispatch<string>;
  setIsNewWallet: Dispatch<boolean>;
  navigation: MutableRefObject<NavigationContainerRef<any> | undefined>;
  mnemonic: string;
  onEnterExistingMnemonic: (m: string) => void;
  currencyFormatter(value: number): string;
};

export function useApp(): AppHook {
  const navigation = useRef<NavigationContainerRef<any>>();
  const [shouldSetupWallet, setShouldSetupWallet] = useState(false);
  const [isNewWallet, setIsNewWallet] = useState(false);
  const [mnemonic, setMnemonic] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  useEffect(() => {
    async function onFirstLoad() {
      if (!navigation.current) {
        console.log('waiting for navigation container...');
        setTimeout(() => onFirstLoad(), 1000);
        return;
      }
      console.log('done.');
      AsyncStorage.getItem(SECURE_ACCESS_SET).then(result => {
        if (result) {
          setLoginRoute(navigation);
        } else {
          navigation.current?.navigate(AppNavigation.Root.Onboard, {
            screen: AppNavigation.Root.Welcome,
          });
        }
      });
    }

    onFirstLoad().then();
  }, []);

  function onPinCreated(pin: string, isResetting = false): Observable<boolean> {
    return from(getEncryptionKey(pin)).pipe(
      switchMap(key => encrypt(mnemonic, key)),
      switchMap((encryptedData: string) =>
        BiometricsSDK.storeWalletWithPin(encryptedData, isResetting),
      ),
      switchMap(pinSaved => {
        if (pinSaved === false) {
          throw Error('Pin not saved');
        }

        return isResetting
          ? Promise.reject(false)
          : BiometricsSDK.canUseBiometry();
      }),
      map((canUseBiometry: boolean) => {
        if (canUseBiometry) {
          navigation.current?.navigate(AppNavigation.Root.Welcome, {
            screen: AppNavigation.Onboard.CreateWalletStack,
            params: {screen: AppNavigation.CreateWallet.BiometricLogin},
          });
        } else {
          onEnterWallet(mnemonic);
        }
        return true;
      }),
    );
  }

  function onEnterWallet(m?: string) {
    if (m && m !== mnemonic) {
      setMnemonic(m);
    }
    navigation.current?.reset({
      index: 0,
      routes: [
        {
          name: AppNavigation.Root.Wallet,
        },
      ],
    });
    setShouldSetupWallet(true);
  }

  function onEnterExistingMnemonic(m: string): void {
    BiometricsSDK.clearWalletKey().then(() => {
      setMnemonic(m);
      navigation.current?.navigate(AppNavigation.LoginWithMnemonic.CreatePin);
    });
  }

  function onSavedMnemonic(mnemonic: string, isResetting = false): void {
    setMnemonic(mnemonic);
    if (!isResetting) {
      navigation.current?.navigate(AppNavigation.CreateWallet.CheckMnemonic);
    }
  }

  async function immediateLogout() {
    await AsyncStorage.removeItem(SECURE_ACCESS_SET);
    await BiometricsSDK.clearWalletKey();
    setMnemonic('');
    resetNavToRoot(navigation);
  }

  function onExit(): Observable<ExitEvents> {
    const exitPrompt = new AsyncSubject<ExitPromptAnswers>();
    const dialogOp: Observable<ExitFinished> = exitPrompt.pipe(
      map((answer: ExitPromptAnswers) => {
        switch (answer) {
          case ExitPromptAnswers.Cancel:
            return new ExitCanceled();
          case ExitPromptAnswers.Ok:
            return new ExitFinished();
        }
      }),
      map((exitEvent: ExitEvents) => {
        if (exitEvent instanceof ExitFinished) {
          resetNavToRoot(navigation);
          BackHandler.exitApp();
        }
        return exitEvent;
      }),
    );
    return concat(of(new ShowExitPrompt(exitPrompt)), dialogOp, asyncScheduler);
  }

  const currencyFormatter = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
    });

    return formatter.format.bind(formatter);
  }, [selectedCurrency]);

  return {
    shouldSetupWallet,
    mnemonic,
    immediateLogout,
    onEnterWallet,
    onExit,
    onSavedMnemonic,
    onPinCreated,
    onEnterExistingMnemonic,
    navigation,
    resetNavToEnterMnemonic,
    isNewWallet,
    setIsNewWallet,
    selectedCurrency,
    setSelectedCurrency,
    currencyFormatter,
  };
}

export interface ExitEvents {}

export class ShowExitPrompt implements ExitEvents {
  prompt: AsyncSubject<ExitPromptAnswers>;

  constructor(prompt: AsyncSubject<ExitPromptAnswers>) {
    this.prompt = prompt;
  }
}

export class ExitFinished implements ExitEvents {}

export class ExitCanceled implements ExitEvents {}

export enum ExitPromptAnswers {
  Ok,
  Cancel,
}

function resetNavToRoot(
  navigation: MutableRefObject<NavigationContainerRef<any> | undefined>,
) {
  navigation.current?.reset({
    index: 0,
    routes: [
      {
        name: AppNavigation.Root.Onboard,
        params: {screen: AppNavigation.Root.Welcome},
      },
    ],
  });
}

function resetNavToEnterMnemonic(
  navigation: MutableRefObject<NavigationContainerRef<any> | undefined>,
) {
  navigation.current?.reset({
    index: 0,
    routes: [
      {
        name: AppNavigation.Root.Onboard,
        params: {screen: AppNavigation.Root.Welcome},
      },
      {
        name: AppNavigation.Root.Onboard,
        params: {
          screen: AppNavigation.Root.Welcome,
          params: {
            screen: AppNavigation.Onboard.EnterWithMnemonicStack,
          },
        },
      },
    ],
  });
}
function setLoginRoute(
  navigation: MutableRefObject<NavigationContainerRef<any> | undefined>,
) {
  navigation.current?.reset({
    index: 0,
    routes: [
      {
        name: AppNavigation.Root.Onboard,
        params: {screen: AppNavigation.Root.Welcome},
      },
      {
        name: AppNavigation.Root.Onboard,
        params: {
          screen: AppNavigation.Root.Welcome,
          params: {
            screen: AppNavigation.Onboard.EnterWithMnemonicStack,
          },
        },
      },
      {
        name: AppNavigation.Root.Onboard,
        params: {
          screen: AppNavigation.Root.Welcome,
          params: {
            screen: AppNavigation.Onboard.Login,
          },
        },
      },
    ],
  });
}
