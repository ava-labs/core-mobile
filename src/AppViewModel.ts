import WalletSDK from './WalletSDK'
import {asyncScheduler, AsyncSubject, BehaviorSubject, concat, from, Observable, of} from 'rxjs'
import {MnemonicWallet, NetworkConstants} from "@avalabs/avalanche-wallet-sdk"
import {concatMap, map, subscribeOn} from "rxjs/operators"
import BiometricsSDK from "./BiometricsSDK"
import {BackHandler} from "react-native"

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
  wallet: MnemonicWallet | null = null
  selectedView: BehaviorSubject<SelectedView> = new BehaviorSubject<SelectedView>(SelectedView.Onboard)

  onComponentMount = (): void => {
    WalletSDK.setNetwork(NetworkConstants.TestnetConfig)
    BiometricsSDK.hasWalletStored().then((value) => {
      if (value) {
        this.setSelectedView(SelectedView.PinOrBiometryLogin)
      }
    })
  }

  onPinCreated = (pin: string): Observable<boolean> => {
    return from(BiometricsSDK.storeWalletWithPin(pin, this.wallet?.mnemonic!)).pipe(
      map(pinSaved => {
        if (pinSaved === false) {
          throw Error("Pin not saved")
        }
        this.setSelectedView(SelectedView.BiometricStore)
        return true
      })
    )
  }


  onEnterWallet = (mnemonic: string): Observable<boolean> => {
    return of(mnemonic).pipe(
      map((mnemonic: string) => WalletSDK.getMnemonicValet(mnemonic)),
      map((wallet: MnemonicWallet) => {
        this.wallet = wallet
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
      case SelectedView.BiometricStore:
        this.setSelectedView(SelectedView.CreatePin)
        return true
      case SelectedView.LoginWithMnemonic:
      case SelectedView.PinOrBiometryLogin:
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
