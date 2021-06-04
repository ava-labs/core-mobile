import {asyncScheduler, BehaviorSubject, Observable, of, zip} from "rxjs"
import {MnemonicWallet, Utils} from "../../wallet_sdk"
import WalletSDK from "../WalletSDK"
import {concatMap, filter, map, subscribeOn, take} from "rxjs/operators"
import {AssetBalanceP, AssetBalanceX} from "../../wallet_sdk/Wallet/types"

export default class {
  hdIndicesSet: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  avaxPrice: BehaviorSubject<number> = new BehaviorSubject(0)
  private wallet!: BehaviorSubject<MnemonicWallet>
  walletCAddress!: Observable<string>
  walletEvmAddrBech!: Observable<string>
  externalAddressesX!: Observable<string[]>
  externalAddressesP!: Observable<string[]>
  addressC!: Observable<string>
  availableC!: Observable<string>
  private avaxBalanceX!: Observable<AssetBalanceX>
  private avaxBalanceP!: Observable<AssetBalanceP>
  availableX!: Observable<string>
  availableP!: Observable<string>

  constructor(wallet: MnemonicWallet) {
    this.wallet = new BehaviorSubject<MnemonicWallet>(wallet)

    this.walletCAddress = this.wallet.pipe(
      map(wallet => wallet.getAddressC()),
    )

    this.walletEvmAddrBech = this.wallet.pipe(
      map(wallet => wallet.getEvmAddressBech()),
    )

    this.externalAddressesX = this.wallet.pipe(
      map(wallet => wallet.getExternalAddressesX()),
    )

    this.externalAddressesP = this.wallet.pipe(
      map(wallet => wallet.getExternalAddressesP()),
    )

    this.addressC = this.wallet.pipe(
      map(wallet => wallet.getAddressC()),
    )

    this.availableC = this.wallet.pipe(
      concatMap(wallet => wallet.evmWallet.updateBalance()),
      map(balance => {
        const symbol = 'AVAX'
        return Utils.bnToAvaxC(balance) + ' ' + symbol
      })
    )

    this.avaxBalanceX = this.hdIndicesSet.pipe(
      filter(hdIndicesSet => hdIndicesSet === true),
      map(
        () => this.wallet.value.getAvaxBalanceX(),
      ),
    )

    this.avaxBalanceP = this.hdIndicesSet.pipe(
      filter(hdIndicesSet => hdIndicesSet === true),
      map(
        () => this.wallet.value.getAvaxBalanceP(),
      ),
    )

    this.availableX = this.avaxBalanceX.pipe(
      filter(assetBalance => assetBalance !== undefined),
      map(assetBalance => {
        return Utils.bnToAvaxX(assetBalance.unlocked) + ' ' + assetBalance.meta.symbol
      })
    )

    this.availableP = this.avaxBalanceP.pipe(
      filter(assetBalance => assetBalance !== undefined),
      map(assetBalance => {
        const symbol = 'AVAX'
        return Utils.bnToAvaxP(assetBalance.unlocked) + ' ' + symbol
      })
    )
  }

  onComponentMount(): void {
    WalletSDK.getAvaxPrice()
      .then(value => {
        this.avaxPrice.next(value)
      })
      .catch(reason => console.log(reason))
  }


  onResetHdIndices(): Observable<boolean> {
    return this.wallet
      .pipe(
        take(1),
        concatMap(wallet => wallet.resetHdIndices()),
        concatMap(() => this.wallet.value.getUtxosX()),
        concatMap(() => this.wallet.value.getUtxosP()),
        map(() => {
          this.hdIndicesSet.next(true)
          this.wallet.next(this.wallet.value)
          return true
        }),
        subscribeOn(asyncScheduler),
      )
  }

  onSendAvaxX(addressX: string, amount: string, memo?: string): Observable<string> {
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

  onSendAvaxC(addressC: string, amount: string): Observable<string> {
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
}
