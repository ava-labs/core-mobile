import {asyncScheduler, BehaviorSubject, concat, defer, Observable, of, zip} from 'rxjs';
import {concatMap, filter, subscribeOn, take, tap} from 'rxjs/operators';
import {Utils} from "@avalabs/avalanche-wallet-sdk"
import {WalletProvider} from "@avalabs/avalanche-wallet-sdk/dist/Wallet/Wallet"


export default class {
  private wallet!: BehaviorSubject<WalletProvider>
  loaderVisible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  loaderMsg: BehaviorSubject<string> = new BehaviorSubject<string>("")
  cameraVisible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  addressCToSendTo: BehaviorSubject<string> = new BehaviorSubject<string>("")

  constructor(wallet: WalletProvider) {
    this.wallet = new BehaviorSubject<WalletProvider>(wallet)
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
    this.addressCToSendTo.next(data)
    this.cameraVisible.next(false)
  }

  clearAddress(): void {
    this.addressCToSendTo.next("")
  }
}
