import {BehaviorSubject, from} from "rxjs"
import WalletSDK from "../WalletSDK"
import {delay, retryWhen, tap} from "rxjs/operators"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"

export default class {
  avaxPrice: BehaviorSubject<number> = new BehaviorSubject(0)
  wallet: BehaviorSubject<MnemonicWallet>

  constructor(wallet: BehaviorSubject<MnemonicWallet>) {
    this.wallet = wallet
  }

  onComponentMount = (): void => {
    this.fetchAvaxPriceWithRetryOnError()
  }


  private fetchAvaxPriceWithRetryOnError = (): void => {
    from(WalletSDK.getAvaxPrice()).pipe(
      retryWhen(errors => errors.pipe(
        tap(err => console.warn(err)),
        delay(5000)
        )
      )
    ).subscribe({
      next: value => this.avaxPrice.next(value)
    })
  }
}
