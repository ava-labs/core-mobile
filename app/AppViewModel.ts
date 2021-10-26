import {
  asyncScheduler,
  AsyncSubject,
  BehaviorSubject,
  concat,
  delay,
  from,
  Observable,
  of,
  tap,
} from 'rxjs';
import {concatMap, map, switchMap} from 'rxjs/operators';
import {BackHandler} from 'react-native';
import BiometricsSDK from 'utils/BiometricsSDK';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SECURE_ACCESS_SET} from 'resources/Constants';
import {encrypt, getEncryptionKey} from 'screens/login/utils/EncryptionHelper';
import {WalletContextType} from 'dto/TypeUtils';
import {onEnterWallet} from 'App';

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

class AppViewModel {
  mnemonic = '';
  selectedView: BehaviorSubject<SelectedView | undefined> = new BehaviorSubject<
    SelectedView | undefined
  >(undefined);

  onComponentMount = (): void => {
    AsyncStorage.getItem(SECURE_ACCESS_SET).then(result => {
      if (result) {
        this.setSelectedView(SelectedView.PinOrBiometryLogin);
      } else {
        this.setSelectedView(SelectedView.Onboard);
      }
    });
  };

  onPinCreated = (pin: string, isResetting = false, walletContext?: WalletContextType): Observable<boolean> => {
    return from(getEncryptionKey(pin)).pipe(
      switchMap(key => encrypt(this.mnemonic, key)),
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
          this.setSelectedView(SelectedView.BiometricStore);
        } else {
          onEnterWallet(this.mnemonic, walletContext?.setMnemonic);
        }
        return true;
      }),
    );
  };

  onEnterWallet = (mnemonic: string): Observable<boolean> => {
    return of(mnemonic).pipe(
      tap((mnemonic: string) => {
        this.mnemonic = mnemonic;
        this.setSelectedView(SelectedView.Main);
      }),
      delay(10, asyncScheduler), //give UI chance to update selected view
      map(() => {
        return true;
      }),
    );
  };

  onEnterExistingMnemonic = (mnemonic: string): void => {
    BiometricsSDK.clearWalletKey().then(() => {
      this.mnemonic = mnemonic;
      this.setSelectedView(SelectedView.CreatePinForExistingWallet);
    });
  };

  onSavedMnemonic = (mnemonic: string, isResetting = false): void => {
    this.mnemonic = mnemonic;
    if (!isResetting) {
      this.setSelectedView(SelectedView.CheckMnemonic);
    }
  };

  onLogout = (): Observable<LogoutEvents> => {
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
          this.mnemonic = '';
          this.setSelectedView(SelectedView.Onboard);
        }
        return new LogoutFinished();
      }),
    );
    return concat(
      of(new ShowLogoutPrompt(deleteBioDataPrompt)),
      dialogOp,
      asyncScheduler,
    );
  };

  async immediateLogout() {
    await AsyncStorage.removeItem(SECURE_ACCESS_SET);
    await BiometricsSDK.clearWalletKey();
    this.mnemonic = '';
    this.setSelectedView(SelectedView.Onboard);
  }

  onExit = (): Observable<ExitEvents> => {
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
          this.setSelectedView(SelectedView.Onboard);
          BackHandler.exitApp();
        }
        return new LogoutFinished();
      }),
    );
    return concat(of(new ShowExitPrompt(exitPrompt)), dialogOp, asyncScheduler);
  };

  setSelectedView = (view?: SelectedView): void => {
    this.selectedView.next(view);
  };

  /**
   * Selects appropriate view and returns true if back press should be consumed here.
   */
  onBackPressed = (): boolean => {
    switch (this.selectedView.value) {
      case SelectedView.Onboard:
        this.setSelectedView(undefined);
        BackHandler.exitApp();
        return true;
      case SelectedView.CreateWallet:
        this.setSelectedView(SelectedView.Onboard);
        return true;
      case SelectedView.CheckMnemonic:
        this.setSelectedView(SelectedView.CreateWallet);
        return true;
      case SelectedView.CreatePin:
        this.setSelectedView(SelectedView.CheckMnemonic);
        return true;
      case SelectedView.CreatePinForExistingWallet:
        this.setSelectedView(SelectedView.Onboard);
        return true;
      case SelectedView.BiometricStore:
        this.setSelectedView(SelectedView.CreatePin);
        return true;
      case SelectedView.LoginWithMnemonic:
      case SelectedView.PinOrBiometryLogin:
        this.setSelectedView(SelectedView.Onboard);
        return true;
      case SelectedView.Main:
        return false;
      default:
        return false;
    }
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

export default new AppViewModel();
