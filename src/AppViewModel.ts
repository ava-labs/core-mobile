import WalletSDK from './WalletSDK'
import {asyncScheduler, AsyncSubject, BehaviorSubject, concat, from, Observable, of} from 'rxjs'
import {MnemonicWallet, NetworkConstants, SingletonWallet} from "@avalabs/avalanche-wallet-sdk"
import {catchError, concatMap, map, subscribeOn, switchMap, tap} from "rxjs/operators"
import BiometricsSDK from "./BiometricsSDK"
import {BackHandler} from "react-native"
import {WalletProvider} from "@avalabs/avalanche-wallet-sdk/dist/Wallet/Wallet"

export enum SelectedView {
  Onboard,
  CreateWallet,
  CheckMnemonic,
  CreatePin,
  BiometricLogin,
  LoginWithMnemonic,
  LoginWithPrivateKey,
  LoginWithKeystoreFile,
  Main,
}

export default class {
  wallet: WalletProvider | null = null
  selectedView: BehaviorSubject<SelectedView> = new BehaviorSubject<SelectedView>(SelectedView.Onboard)

  onComponentMount = (): void => {
    WalletSDK.setNetwork(NetworkConstants.TestnetConfig)
  }

  onPinCreated = (pin: string): Observable<boolean> => {
    return from(BiometricsSDK.savePin(pin)).pipe(
      map(pinSaved => {
        if (pinSaved === false) {
          throw Error("Pin not saved")
        }
        this.setSelectedView(SelectedView.BiometricLogin)
        return true
      })
    )
  }


  onEnterWallet = (mnemonic: string): Observable<boolean> => {
    return of(mnemonic).pipe(
      map((mnemonic: string) => WalletSDK.getMnemonicValet(mnemonic)),
      map((wallet: MnemonicWallet) => {
        this.wallet = wallet
        return wallet.mnemonic
      }),
      switchMap(mnemonic => BiometricsSDK.saveWalletKey(mnemonic)),
      switchMap(credentials => {
        if (credentials === false) {
          throw Error("Error saving mnemonic")
        }
        return BiometricsSDK.loadWalletKey(BiometricsSDK.storeOptions)
      }),
      map(credentials => {
        if (credentials === false) {
          throw Error("Error saving mnemonic")
        }
        return true
      }),
      catchError((err: Error) => {
        return from(BiometricsSDK.clearWalletKey()).pipe(
          tap(() => {
            throw err
          })
        )
      }),
      map(() => {
        this.setSelectedView(SelectedView.Main)
        return true
      }),
      subscribeOn(asyncScheduler)
    )
  }

  onEnterSingletonWallet = (privateKey: string): Observable<boolean> => {
    return of(privateKey).pipe(
      map((privateKey: string) => [WalletSDK.getSingletonWallet(privateKey), privateKey]),
      map(([wallet, privateKey]) => {
        this.wallet = wallet as SingletonWallet
        return privateKey as string
      }),
      switchMap(privateKey => BiometricsSDK.saveWalletKey(privateKey)),
      switchMap(credentials => {
        if (credentials === false) {
          throw Error("Error saving private key")
        }
        return BiometricsSDK.loadWalletKey(BiometricsSDK.storeOptions)
      }),
      map(credentials => {
        if (credentials === false) {
          throw Error("Error saving private key")
        }
        return true
      }),
      catchError((err: Error) => {
        return from(BiometricsSDK.clearWalletKey()).pipe(
          tap(() => {
            throw err
          })
        )
      }),
      map(() => {
        this.setSelectedView(SelectedView.Main)
        return true
      }),
      subscribeOn(asyncScheduler)
    )
  }

  onSavedMnemonic = (mnemonic: string): void => {
    this.wallet = WalletSDK.getMnemonicValet(mnemonic)
    this.setSelectedView(SelectedView.CheckMnemonic)
  }

  onLogout = (): Observable<LogoutEvents> => {
    const deleteBioDataPrompt = new AsyncSubject<LogoutPromptAnswers>()
    const dialogOp: Observable<LogoutFinished> = deleteBioDataPrompt.pipe(
      concatMap((answer: LogoutPromptAnswers) => {
        switch (answer) {
          case LogoutPromptAnswers.Yes:
            return from(BiometricsSDK.clearWalletKey()).pipe(map(() => false))
          case LogoutPromptAnswers.Cancel:
            return of(true)
        }
      }),
      map((isCanceled: boolean) => {
        if (!isCanceled) {
          this.wallet = null
          this.setSelectedView(SelectedView.Onboard)
        }
        return new LogoutFinished()
      })
    )
    return concat(of(new ShowLogoutPrompt(deleteBioDataPrompt)), dialogOp, asyncScheduler)
  }

  onExit = (): Observable<ExitEvents> => {
    const exitPrompt = new AsyncSubject<ExitPromptAnswers>()
    const dialogOp: Observable<ExitFinished> = exitPrompt.pipe(
      map((answer: ExitPromptAnswers) => {
        switch (answer) {
          case ExitPromptAnswers.Ok:
            return new ExitFinished()
        }
      }),
      map(() => {
        this.setSelectedView(SelectedView.Onboard)
        BackHandler.exitApp()
        return new LogoutFinished()
      }),
    )
    return concat(of(new ShowExitPrompt(exitPrompt)), dialogOp, asyncScheduler)
  }

  setSelectedView = (view: SelectedView): void => {
    this.selectedView.next(view)
  }

  /**
   * Selects appropriate view and returns true if back press should be consumed here.
   */
  onBackPressed = (): boolean => {
    switch (this.selectedView.value) {
      case SelectedView.Onboard:
        return false
      case SelectedView.CreateWallet:
        this.setSelectedView(SelectedView.Onboard)
        return true
      case SelectedView.CheckMnemonic:
        this.setSelectedView(SelectedView.CreateWallet)
        return true
      case SelectedView.CreatePin:
        this.setSelectedView(SelectedView.CheckMnemonic)
        return true
      case SelectedView.BiometricLogin:
        this.setSelectedView(SelectedView.CreatePin)
        return true
      case SelectedView.LoginWithMnemonic:
      case SelectedView.LoginWithPrivateKey:
      case SelectedView.LoginWithKeystoreFile:
        this.setSelectedView(SelectedView.Onboard)
        return true
      case SelectedView.Main:
        return false

    }
  }
}


export interface LogoutEvents {
}

export class ShowLogoutPrompt implements LogoutEvents {
  prompt: AsyncSubject<LogoutPromptAnswers>

  constructor(prompt: AsyncSubject<LogoutPromptAnswers>) {
    this.prompt = prompt
  }
}

export class LogoutFinished implements LogoutEvents {
}

export enum LogoutPromptAnswers {
  Yes,
  Cancel
}

export interface ExitEvents {
}

export class ShowExitPrompt implements ExitEvents {
  prompt: AsyncSubject<ExitPromptAnswers>

  constructor(prompt: AsyncSubject<ExitPromptAnswers>) {
    this.prompt = prompt
  }
}

export class ExitFinished implements ExitEvents {
}

export enum ExitPromptAnswers {
  Ok
}
