import {BehaviorSubject} from "rxjs"
import {WalletProvider} from "@avalabs/avalanche-wallet-sdk/dist/Wallet/Wallet"

export default class {
  wallet: BehaviorSubject<WalletProvider>

  constructor(wallet: WalletProvider) {
    this.wallet = new BehaviorSubject<WalletProvider>(wallet)
  }
}
