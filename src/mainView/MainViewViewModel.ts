import {BN} from 'avalanche';
import {asyncScheduler, BehaviorSubject, from, Observable, of, zip} from "rxjs"
import {MnemonicWallet, Utils} from "../../wallet_sdk"
import WalletSDK from "../WalletSDK"
import {concatMap, delay, filter, map, retryWhen, subscribeOn, take, tap} from "rxjs/operators"
import {AssetBalanceP, iWalletAddressChanged, WalletBalanceX} from "../../wallet_sdk/Wallet/types"

enum WalletEvents {
  AddressChanged = "addressChanged",
  BalanceChangedX = "balanceChangedX",
  BalanceChangedP = "balanceChangedP",
  BalanceChangedC = "balanceChangedC",
}

export default class {
  avaxPrice: BehaviorSubject<number> = new BehaviorSubject(0)
  wallet: BehaviorSubject<MnemonicWallet>
  walletCAddress: Observable<string>
  walletEvmAddrBech: Observable<string>
  addressX: BehaviorSubject<string> = new BehaviorSubject<string>("")
  addressP: BehaviorSubject<string> = new BehaviorSubject<string>("")
  addressC: Observable<string>
  stakingAmount: Observable<string>
  availableX: Observable<string>
  availableP: Observable<string>
  availableC: Observable<string>
  newBalanceX: BehaviorSubject<WalletBalanceX | null> = new BehaviorSubject<WalletBalanceX | null>(null)
  newBalanceP: BehaviorSubject<AssetBalanceP | null> = new BehaviorSubject<AssetBalanceP | null>(null)
  newBalanceC: BehaviorSubject<BN | null> = new BehaviorSubject<BN | null>(null)

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

    this.stakingAmount = this.wallet.pipe(
      concatMap(wallet => wallet.getStake()),
      map(stake => {
        const symbol = 'AVAX'
        return Utils.bnToLocaleString(stake, 9) + ' ' + symbol
      })
    )

    this.availableX = this.newBalanceX.pipe(
      filter(value => value !== null),
      map(assetBalance => assetBalance!['U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK'].unlocked), //fixme should not be hardcoded?
      map(balance => {
        const symbol = 'AVAX'
        return Utils.bnToAvaxX(balance) + ' ' + symbol
      })
    )

    this.availableP = this.newBalanceP.pipe(
      filter(value => value !== null),
      map(assetBalance => assetBalance!.unlocked),
      map(balance => {
        const symbol = 'AVAX'
        return Utils.bnToAvaxP(balance) + ' ' + symbol
      })
    )

    this.availableC = this.newBalanceC.pipe(
      filter(value => value !== null),
      map(balance => {
        const symbol = 'AVAX'
        return Utils.bnToAvaxC(<BN>balance) + ' ' + symbol
      })
    )
  }

  onComponentMount = (): void => {
    this.fetchAvaxPriceWithRetryOnError()
    this.addBalanceListeners(this.wallet.value)
    this.wallet.value.on(WalletEvents.AddressChanged, this.onAddressChanged)
  }

  onComponentUnMount = (): void => {
    this.removeBalanceListeners(this.wallet.value)
    this.wallet.value.off(WalletEvents.AddressChanged, this.onAddressChanged)
  }

  onResetHdIndices = (): Observable<boolean> => {
    return this.wallet
      .pipe(
        take(1),
        concatMap(wallet => wallet.resetHdIndices()),
        concatMap(() => this.wallet.value.getUtxosX()),
        concatMap(() => this.wallet.value.getUtxosP()),
        map(() => {
          this.wallet.next(this.wallet.value)
          return true
        }),
        subscribeOn(asyncScheduler),
      )
  }

  onSendAvaxX = (addressX: string, amount: string, memo?: string): Observable<string> => {
    return zip(
      this.wallet,
      of(amount),
      of(addressX)
    ).pipe(
      take(1),
      concatMap(([wallet, amount, toAddress]) => {
        const denomination = wallet.getAvaxBalanceX().meta.denomination
        const bnAmount = Utils.numberToBN(amount, denomination)
        return wallet.sendAvaxX(toAddress, bnAmount, memo)
      }),
      subscribeOn(asyncScheduler),
    )
  }

  onSendAvaxC = (addressC: string, amount: string): Observable<string> => {
    return zip(
      this.wallet,
      of(amount),
      of(addressC)
    ).pipe(
      take(1),
      concatMap(([wallet, amount, toAddress]) => {
        const denomination = 9
        const bnAmount = Utils.numberToBN(amount, denomination)
        const gasPrice = Utils.numberToBN(225, denomination) //todo unfix
        const gasLimit = 21000 //todo unfix
        return wallet.sendAvaxC(toAddress, bnAmount, gasPrice, gasLimit)
      }),
      subscribeOn(asyncScheduler),
    )
  }

  private onBalanceChangedX = (balance: WalletBalanceX): void => {
    this.newBalanceX.next(balance)
  }

  private onBalanceChangedP = (balance: AssetBalanceP): void => {
    this.newBalanceP.next(balance)
  }

  private onBalanceChangedC = (balance: BN): void => {
    this.newBalanceC.next(balance)
  }

  private onAddressChanged = (params: iWalletAddressChanged): void => {
    this.addressX.next(params.X)
    this.addressP.next(params.P)
  }

  private addBalanceListeners = (wallet: MnemonicWallet): void => {
    wallet.on(WalletEvents.BalanceChangedX, this.onBalanceChangedX)
    wallet.on(WalletEvents.BalanceChangedP, this.onBalanceChangedP)
    wallet.on(WalletEvents.BalanceChangedC, this.onBalanceChangedC)
  }

  private removeBalanceListeners = (wallet: MnemonicWallet): void => {
    wallet.off(WalletEvents.BalanceChangedX, this.onBalanceChangedX)
    wallet.off(WalletEvents.BalanceChangedP, this.onBalanceChangedP)
    wallet.off(WalletEvents.BalanceChangedC, this.onBalanceChangedC)
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
