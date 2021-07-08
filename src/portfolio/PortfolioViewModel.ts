import {BehaviorSubject, from, Observable} from "rxjs"
import WalletSDK from "../WalletSDK"
import {delay, map, retryWhen, tap} from "rxjs/operators"
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

  constructor(wallet: BehaviorSubject<MnemonicWallet>) {
    this.wallet = wallet

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
