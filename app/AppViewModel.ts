import {asyncScheduler, AsyncSubject, concat, from, Observable, of} from 'rxjs';
import {concatMap, map, switchMap} from 'rxjs/operators';
import {BackHandler} from 'react-native';
import BiometricsSDK from 'utils/BiometricsSDK';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SECURE_ACCESS_SET} from 'resources/Constants';
import {encrypt, getEncryptionKey} from 'screens/login/utils/EncryptionHelper';
import {Dispatch, useEffect, useState} from 'react';

export enum SelectedView {
  Onboard,
  CreateWallet,
  CheckMnemonic,
  CreatePin,
  CreatePinForExistingWallet,
  BiometricStore,
  LoginWithMnemonic,
  PinOrBiometryLogin,
  Main,
}

export type AppHook = {
  shouldSetupWallet: boolean;
  mnemonic: string;
  immediateLogout: () => Promise<void>;
  onEnterWallet: (m?: string) => void;
  onExit: () => Observable<ExitEvents>;
  onSavedMnemonic: (mnemonic: string, isResetting?: boolean) => void;
  onLogout: () => Observable<LogoutEvents>;
  onPinCreated: (pin: string, isResetting?: boolean) => Observable<boolean>;
  setSelectedView: Dispatch<SelectedView | undefined>;
  onEnterExistingMnemonic: (m: string) => void;
  selectedView: SelectedView | undefined;
  onBackPressed: () => boolean;
};

export function useApp(): AppHook {
  const [shouldSetupWallet, setShouldSetupWallet] = useState(false);
  const [mnemonic, setMnemonic] = useState<string>('');
  const [selectedView, setSelectedView] = useState<SelectedView | undefined>(
    undefined,
  );

  useEffect(() => {
    AsyncStorage.getItem(SECURE_ACCESS_SET).then(result => {
      if (result) {
        setSelectedView(SelectedView.PinOrBiometryLogin);
      } else {
        setSelectedView(SelectedView.Onboard);
      }
    });
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
          setSelectedView(SelectedView.BiometricStore);
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
    setSelectedView(SelectedView.Main);
    setShouldSetupWallet(true);
  }

  function onEnterExistingMnemonic(m: string): void {
    BiometricsSDK.clearWalletKey().then(() => {
      setMnemonic(m);
      setSelectedView(SelectedView.CreatePinForExistingWallet);
    });
  }

  function onSavedMnemonic(mnemonic: string, isResetting = false): void {
    setMnemonic(mnemonic);
    if (!isResetting) {
      setSelectedView(SelectedView.CheckMnemonic);
    }
  }

  function onLogout(): Observable<LogoutEvents> {
    AsyncStorage.removeItem(SECURE_ACCESS_SET);
    const deleteBioDataPrompt = new AsyncSubject<LogoutPromptAnswers>();
    const dialogOp: Observable<LogoutFinished> = deleteBioDataPrompt.pipe(
      concatMap((answer: LogoutPromptAnswers) => {
        switch (answer) {
          case LogoutPromptAnswers.Yes:
            return from(BiometricsSDK.clearWalletKey()).pipe(map(() => false));
          case LogoutPromptAnswers.Cancel:
            return of(true);
        }
      }),
      map((isCanceled: boolean) => {
        if (!isCanceled) {
          setMnemonic('');
          setSelectedView(SelectedView.Onboard);
        }
        return new LogoutFinished();
      }),
    );
    return concat(
      of(new ShowLogoutPrompt(deleteBioDataPrompt)),
      dialogOp,
      asyncScheduler,
    );
  }

  async function immediateLogout() {
    await AsyncStorage.removeItem(SECURE_ACCESS_SET);
    await BiometricsSDK.clearWalletKey();
    setMnemonic('');
    setSelectedView(SelectedView.Onboard);
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
          setSelectedView(SelectedView.Onboard);
          BackHandler.exitApp();
        }
        return new LogoutFinished();
      }),
    );
    return concat(of(new ShowExitPrompt(exitPrompt)), dialogOp, asyncScheduler);
  }

  /**
   * Selects appropriate view and returns true if back press should be consumed here.
   */
  function onBackPressed(): boolean {
    switch (selectedView) {
      case SelectedView.Onboard:
        setSelectedView(undefined);
        BackHandler.exitApp();
        return true;
      case SelectedView.CreateWallet:
        setSelectedView(SelectedView.Onboard);
        return true;
      case SelectedView.CheckMnemonic:
        setSelectedView(SelectedView.CreateWallet);
        return true;
      case SelectedView.CreatePin:
        setSelectedView(SelectedView.CheckMnemonic);
        return true;
      case SelectedView.CreatePinForExistingWallet:
        setSelectedView(SelectedView.Onboard);
        return true;
      case SelectedView.BiometricStore:
        setSelectedView(SelectedView.CreatePin);
        return true;
      case SelectedView.LoginWithMnemonic:
      case SelectedView.PinOrBiometryLogin:
        setSelectedView(SelectedView.Onboard);
        return true;
      case SelectedView.Main:
        return false;
      default:
        return false;
    }
  }

  return {
    shouldSetupWallet,
    mnemonic,
    selectedView,
    setSelectedView,
    onPinCreated,
    onEnterWallet,
    onEnterExistingMnemonic,
    onSavedMnemonic,
    onLogout,
    immediateLogout,
    onExit,
    onBackPressed,
  };
}

export interface LogoutEvents {}

export class ShowLogoutPrompt implements LogoutEvents {
  prompt: AsyncSubject<LogoutPromptAnswers>;

  constructor(prompt: AsyncSubject<LogoutPromptAnswers>) {
    this.prompt = prompt;
  }
}

export class LogoutFinished implements LogoutEvents {}

export enum LogoutPromptAnswers {
  Yes,
  Cancel,
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
