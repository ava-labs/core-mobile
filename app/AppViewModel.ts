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
import WalletSDK from 'utils/WalletSDK';
import BiometricsSDK from 'utils/BiometricsSDK';

export enum SelectedView {
  Onboard,
  CreateWallet,
  CheckMnemonic,
  CreatePin,
  BiometricStore,
  LoginWithMnemonic,
  PinOrBiometryLogin,
  Main,
}

export default class {
  mnemonic: string = '';
  selectedView: BehaviorSubject<SelectedView> =
    new BehaviorSubject<SelectedView>(SelectedView.Onboard);

  onComponentMount = (): void => {
    BiometricsSDK.hasWalletStored().then(value => {
      if (value) {
        this.setSelectedView(SelectedView.PinOrBiometryLogin);
      }
    });
  };

  onPinCreated = (pin: string): Observable<boolean> => {
    return from(BiometricsSDK.storeWalletWithPin(pin, this.mnemonic)).pipe(
      switchMap(pinSaved => {
        if (pinSaved === false) {
          throw Error('Pin not saved');
        }
        return BiometricsSDK.canUseBiometry();
      }),
      map((canUseBiometry: boolean) => {
        if (canUseBiometry) {
          this.setSelectedView(SelectedView.BiometricStore);
        } else {
          this.setSelectedView(SelectedView.Main);
        }
        return true;
      }),
    );
  };

  onEnterWallet = (mnemonic: string): Observable<boolean> => {
    return of(mnemonic).pipe(
      tap((mnemonic: string) => {
        WalletSDK.getMnemonicValet(mnemonic);
        this.setSelectedView(SelectedView.Main);
      }),
      delay(10, asyncScheduler), //give UI chance to update selected view
      map(() => {
        return true;
      }),
    );
  };

  onSavedMnemonic = (mnemonic: string): void => {
    this.mnemonic = mnemonic;
    this.setSelectedView(SelectedView.CheckMnemonic);
  };

  onLogout = (): Observable<LogoutEvents> => {
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

  onExit = (): Observable<ExitEvents> => {
    const exitPrompt = new AsyncSubject<ExitPromptAnswers>();
    const dialogOp: Observable<ExitFinished> = exitPrompt.pipe(
      map((answer: ExitPromptAnswers) => {
        switch (answer) {
          case ExitPromptAnswers.Ok:
            return new ExitFinished();
        }
      }),
      map(() => {
        this.setSelectedView(SelectedView.Onboard);
        BackHandler.exitApp();
        return new LogoutFinished();
      }),
    );
    return concat(of(new ShowExitPrompt(exitPrompt)), dialogOp, asyncScheduler);
  };

  setSelectedView = (view: SelectedView): void => {
    this.selectedView.next(view);
  };

  /**
   * Selects appropriate view and returns true if back press should be consumed here.
   */
  onBackPressed = (): boolean => {
    switch (this.selectedView.value) {
      case SelectedView.Onboard:
        return false;
      case SelectedView.CreateWallet:
        this.setSelectedView(SelectedView.Onboard);
        return true;
      case SelectedView.CheckMnemonic:
        this.setSelectedView(SelectedView.CreateWallet);
        return true;
      case SelectedView.CreatePin:
        this.setSelectedView(SelectedView.CheckMnemonic);
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

export enum ExitPromptAnswers {
  Ok,
}
