import WalletSDK from './WalletSDK'
import {asyncScheduler, AsyncSubject, BehaviorSubject, concat, from, Observable, of} from 'rxjs'
import {MnemonicWallet, NetworkConstants} from "@avalabs/avalanche-wallet-sdk"
import {concatMap, map, subscribeOn} from "rxjs/operators"
import BiometricsSDK from "./BiometricsSDK"

export enum SelectedView {
  Onboard,
  CreateWallet,
  Login,
  Main,
  CheckMnemonic,
}

export interface LogoutEvents {
}

export class ShowAlert implements LogoutEvents {
  question: AsyncSubject<boolean>

  constructor(shouldDeleteBioData: AsyncSubject<boolean>) {
    this.question = shouldDeleteBioData
  }
}

export class LogoutFinished implements LogoutEvents {
}


export default class {
  wallet: MnemonicWallet | null = null
  selectedView: BehaviorSubject<SelectedView> = new BehaviorSubject<SelectedView>(SelectedView.Onboard)

  onComponentMount = (): void => {
    WalletSDK.setNetwork(NetworkConstants.TestnetConfig)
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
    const deleteBioDataPrompt = new AsyncSubject<boolean>()
    const dialogOp: Observable<LogoutFinished> = deleteBioDataPrompt.pipe(
      concatMap(shouldDeleteBioData => {
        if (shouldDeleteBioData) {
          return from(BiometricsSDK.clearMnemonic()).pipe(map(() => true))
        } else {
          return of(false)
        }
      }),
      map(() => {
        this.wallet = null
        this.setSelectedView(SelectedView.Onboard)
        return new LogoutFinished()
      })
    )
    return concat(of(new ShowAlert(deleteBioDataPrompt)), dialogOp, asyncScheduler)
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
      case SelectedView.Login:
        this.setSelectedView(SelectedView.Onboard)
        return true
      case SelectedView.Main:
        return false
      case SelectedView.CheckMnemonic:
        this.setSelectedView(SelectedView.CreateWallet)
        return true

    }
  }
}
