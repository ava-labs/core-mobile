import {asyncScheduler, BehaviorSubject, concat, defer, Observable, of, zip} from 'rxjs';
import {concatMap, filter, subscribeOn, take, tap} from 'rxjs/operators';
import {MnemonicWallet, Utils} from "@avalabs/avalanche-wallet-sdk"


export default class {
  private wallet!: BehaviorSubject<MnemonicWallet>
  loaderVisible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  loaderMsg: BehaviorSubject<string> = new BehaviorSubject<string>("")
  cameraVisible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  addressXToSendTo: BehaviorSubject<string> = new BehaviorSubject<string>("")

  constructor(wallet: MnemonicWallet) {
    this.wallet = new BehaviorSubject<MnemonicWallet>(wallet)
  }

  onSendAvaxX = (addressX: string, amount: string, memo?: string): Observable<string> => {
    return zip(
      this.wallet,
      of(amount),
      of(addressX)
    ).pipe(
      take(1),
      concatMap(([wallet, amount, toAddress]) => {
        const denomination = 9 //todo magic number
        const bnAmount = Utils.numberToBN(amount, denomination)
        return concat(
          of("startLoader"),
          defer(() => wallet.sendAvaxX(toAddress, bnAmount, memo))
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
        error: () => this.loaderVisible.next(false)
      }),
      filter(value => value !== "startLoader"),
      subscribeOn(asyncScheduler),
    )
  }

  onScanBarcode(): void {
    this.cameraVisible.next(true)
  }

  onBarcodeScanned(data: string): void {
    this.addressXToSendTo.next(data)
    this.cameraVisible.next(false)
  }

  clearAddress(): void {
    this.addressXToSendTo.next("")
  }

}
