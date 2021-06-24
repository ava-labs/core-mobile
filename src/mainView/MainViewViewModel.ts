import {asyncScheduler, BehaviorSubject, from, Observable} from "rxjs"
import WalletSDK from "../WalletSDK"
import {concatMap, delay, map, retryWhen, subscribeOn, take, tap} from "rxjs/operators"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import {iWalletAddressChanged} from "@avalabs/avalanche-wallet-sdk/dist/Wallet/types"

enum WalletEvents {
  AddressChanged = "addressChanged",
}

export default class {
  avaxPrice: BehaviorSubject<number> = new BehaviorSubject(0)
  wallet: BehaviorSubject<MnemonicWallet>
  walletCAddress: Observable<string>
  walletEvmAddrBech: Observable<string>
  addressX: BehaviorSubject<string> = new BehaviorSubject<string>("")
  addressP: BehaviorSubject<string> = new BehaviorSubject<string>("")
  addressC: Observable<string>

  constructor(wallet: MnemonicWallet) {
    this.wallet = new BehaviorSubject<MnemonicWallet>(wallet)

    this.walletCAddress = this.wallet.pipe(
      map(wallet => wallet.getAddressC()),
    )

    this.walletEvmAddrBech = this.wallet.pipe(
      map(wallet => wallet.getEvmAddressBech()),
    )

    this.addressC = this.wallet.pipe(
      map(wallet => wallet.getAddressC()),
    )
  }

  onComponentMount = (): void => {
    this.fetchAvaxPriceWithRetryOnError()
    this.wallet.value.on(WalletEvents.AddressChanged, this.onAddressChanged)
  }

  onComponentUnMount = (): void => {
    this.wallet.value.off(WalletEvents.AddressChanged, this.onAddressChanged)
  }

  onResetHdIndices = (): Observable<boolean> => {
    return this.wallet
      .pipe(
        take(1),
        concatMap(wallet => wallet.resetHdIndices()),
        concatMap(() => this.wallet.value.updateUtxosX()),
        concatMap(() => this.wallet.value.updateUtxosP()),
        map(() => {
          this.wallet.next(this.wallet.value)
          return true
        }),
        subscribeOn(asyncScheduler),
      )
  }


  private onAddressChanged = (params: iWalletAddressChanged): void => {
    this.addressX.next(params.X)
    this.addressP.next(params.P)
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
