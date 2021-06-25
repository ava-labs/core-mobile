import WalletSDK from './WalletSDK'
import {BehaviorSubject} from 'rxjs'
import {MnemonicWallet, NetworkConstants} from "@avalabs/avalanche-wallet-sdk"

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

  onComponentMount(): void {
    WalletSDK.setNetwork(NetworkConstants.TestnetConfig)
  }

  onEnterWallet(mnemonic: string): void {
    this.wallet = WalletSDK.getMnemonicValet(mnemonic)
    this.setSelectedView(SelectedView.Main)
  }

  onSavedMnemonic(mnemonic: string): void {
    this.wallet = WalletSDK.getMnemonicValet(mnemonic)
    this.setSelectedView(SelectedView.CheckMnemonic)
  }

  onLogout(): void {
    this.wallet?.destroy()
    this.wallet = null
    this.setSelectedView(SelectedView.Onboard)
  }

  setSelectedView(view: SelectedView): void {
    this.selectedView.next(view)
  }
}
