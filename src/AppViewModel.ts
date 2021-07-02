import WalletSDK from './WalletSDK'
import {asyncScheduler, BehaviorSubject, Observable, of} from 'rxjs'
import {MnemonicWallet, NetworkConstants} from "@avalabs/avalanche-wallet-sdk"
import {map, subscribeOn} from "rxjs/operators"

export enum SelectedView {
  Onboard,
  CreateWallet,
  Login,
  Main,
  CheckMnemonic,
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

  onLogout = (): void => {
    this.wallet = null
    this.setSelectedView(SelectedView.Onboard)
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
