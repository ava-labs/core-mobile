import {asyncScheduler, BehaviorSubject, Observable, of} from "rxjs"
import {concatMap, map, subscribeOn, take} from "rxjs/operators"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import {WalletProvider} from "@avalabs/avalanche-wallet-sdk/dist/Wallet/Wallet"


export default class {
  wallet: BehaviorSubject<WalletProvider>

  constructor(wallet: WalletProvider) {
    this.wallet = new BehaviorSubject<WalletProvider>(wallet)
  }


  onResetHdIndices = (): Observable<boolean> => {
    return this.wallet
      .pipe(
        take(1),
        concatMap(wallet => wallet instanceof MnemonicWallet ? wallet.resetHdIndices() : of(true)),
        concatMap(() => this.wallet.value.updateUtxosX()),
        concatMap(() => this.wallet.value.updateUtxosP()),
        concatMap(() => this.wallet.value.updateAvaxBalanceC()),
        concatMap(() => this.wallet.value.updateBalanceERC20()),
        map(() => {
          this.wallet.next(this.wallet.value)
          return true
        }),
        subscribeOn(asyncScheduler),
      )
  }
}
