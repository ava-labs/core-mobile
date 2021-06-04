import {MnemonicWallet, NetworkConstants} from '../wallet_sdk'
import WalletSDK from './WalletSDK'
import {BehaviorSubject, Observable} from 'rxjs'
import {map} from 'rxjs/operators'

export enum SelectedView {
  Login = 0,
  Main
}

export default class {
  mnemonic: BehaviorSubject<string> = new BehaviorSubject<string>("")
  wallet: Observable<MnemonicWallet | null> = this.mnemonic.pipe(
    map(mnemonic => mnemonic === "" ? null : WalletSDK.getMnemonicValet(mnemonic)),
  )
  selectedView: Observable<SelectedView> = this.wallet.pipe(
    map(wallet => wallet === null ? SelectedView.Login : SelectedView.Main)
  )

  onComponentMount(): void {
    WalletSDK.setNetwork(NetworkConstants.TestnetConfig)
  }

  onEnterWallet(mnemonic: string): void {
    this.mnemonic.next(mnemonic)
  }

  onLogout(): void {
    this.mnemonic.next("")
  }
}
