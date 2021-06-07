import {MnemonicWallet, NetworkConstants} from '../wallet_sdk'
import WalletSDK from './WalletSDK'
import {BehaviorSubject} from 'rxjs'

export enum SelectedView {
  Onboard,
  CreateWallet,
  Login,
  Main,
}

export default class {
  wallet: MnemonicWallet | null = null
  selectedView: BehaviorSubject<SelectedView> = new BehaviorSubject<SelectedView>(SelectedView.Onboard)

  onComponentMount(): void {
    WalletSDK.setNetwork(NetworkConstants.TestnetConfig)
  }

  onEnterWallet(mnemonic: string): void {
    this.wallet = WalletSDK.getMnemonicValet(mnemonic)
    this.setSelectedView(SelectedView.Main)
  }

  onLogout(): void {
    this.wallet = null
    this.setSelectedView(SelectedView.Onboard)
  }

  setSelectedView(view: SelectedView): void {
    this.selectedView.next(view)
  }
}
