import {asyncScheduler, BehaviorSubject, concat, defer, Observable, of, zip} from 'rxjs';
import {concatMap, filter, subscribeOn, take, tap} from 'rxjs/operators';
import {MnemonicWallet, Utils} from "@avalabs/avalanche-wallet-sdk"


export default class {
  private wallet!: BehaviorSubject<MnemonicWallet>
  loaderVisible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  loaderMsg: BehaviorSubject<string> = new BehaviorSubject<string>("")

  constructor(wallet: MnemonicWallet) {
    this.wallet = new BehaviorSubject<MnemonicWallet>(wallet)
  }

  onSendAvaxC = (addressX: string, amount: string, memo?: string): Observable<string> => {
    return zip(
      this.wallet,
      of(amount),
      of(addressX)
    ).pipe(
      take(1),
      concatMap(([wallet, amount, toAddress]) => {
        const denomination = 9
        const bnAmount = Utils.numberToBN(amount, 18)
        const gasPrice = Utils.numberToBN(225, denomination) //todo unfix
        const gasLimit = 21000 //todo unfix
        return concat(
          of("startLoader"),
          defer(() => wallet.sendAvaxC(toAddress, bnAmount, gasPrice, gasLimit))
        )
      }),
      tap({
        next: value => {
          if (value === "startLoader") {
            this.loaderVisible.next(true)
            this.loaderMsg.next("Sending...")
          }
        },
        complete: () => this.loaderVisible.next(false),
        error: err => this.loaderVisible.next(false)
      }),
      filter(value => value !== "startLoader"),
      subscribeOn(asyncScheduler),
    )
  }
}
