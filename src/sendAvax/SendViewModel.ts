import {BehaviorSubject} from "rxjs"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"

export default class {
  wallet: BehaviorSubject<MnemonicWallet>

  constructor(wallet: MnemonicWallet) {
    this.wallet = new BehaviorSubject<MnemonicWallet>(wallet)
  }
}
