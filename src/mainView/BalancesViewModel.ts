import {BehaviorSubject, combineLatest, merge, Observable} from "rxjs"
import {concatMap, filter, map, tap} from "rxjs/operators"
import {BN, MnemonicWallet, Utils} from "@avalabs/avalanche-wallet-sdk"
import {AssetBalanceP, WalletBalanceX} from "@avalabs/avalanche-wallet-sdk/dist/Wallet/types"

enum WalletEvents {
  BalanceChangedX = "balanceChangedX",
  BalanceChangedP = "balanceChangedP",
  BalanceChangedC = "balanceChangedC",
}

export default class {
  wallet: BehaviorSubject<MnemonicWallet>
  private balanceX: Observable<BN>
  private balanceP: Observable<BN>
  private balanceC: Observable<BN>
  private stake: Observable<BN>
  availableX: Observable<string>
  availableP: Observable<string>
  availableC: Observable<string>
  stakingAmount: Observable<string>
  availableTotal: Observable<string>
  newBalanceX: BehaviorSubject<WalletBalanceX | null> = new BehaviorSubject<WalletBalanceX | null>(null)
  newBalanceP: BehaviorSubject<AssetBalanceP | null> = new BehaviorSubject<AssetBalanceP | null>(null)
  newBalanceC: BehaviorSubject<BN | null> = new BehaviorSubject<BN | null>(null)

  constructor(wallet: MnemonicWallet) {
    this.wallet = new BehaviorSubject<MnemonicWallet>(wallet)

    this.stake = this.wallet.pipe(
      concatMap(wallet => wallet.getStake()),
      tap(stake => console.log(stake)),
      map(value => value === undefined ? 0 : value)
    )

    this.stakingAmount = this.stake.pipe(
      map(stake => {
        const symbol = 'AVAX'
        return Utils.bnToLocaleString(stake, 9) + ' ' + symbol
      })
    )

    this.balanceX = this.newBalanceX.pipe(
      filter(value => value !== null),
      map(assetBalance => assetBalance!['U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK'].unlocked), //fixme should not be hardcoded?
    )

    this.availableX = this.balanceX.pipe(
      map(balance => {
        const symbol = 'AVAX'
        return Utils.bnToAvaxX(balance) + ' ' + symbol
      })
    )

    this.balanceP = this.newBalanceP.pipe(
      filter(value => value !== null),
      map(assetBalance => assetBalance!.unlocked),
    )

    this.availableP = this.balanceP.pipe(
      map(balance => {
        const symbol = 'AVAX'
        return Utils.bnToAvaxP(balance) + ' ' + symbol
      })
    )

    this.balanceC = merge(
      this.wallet.value.evmWallet.updateBalance(),
      this.newBalanceC.pipe(filter(value => value !== null))
    ).pipe(
      map(balance => balance!)
    )

    this.availableC = this.balanceC.pipe(
      map(balance => {
        const symbol = 'AVAX'
        return Utils.bnToAvaxC(balance) + ' ' + symbol
      })
    )

    this.availableTotal = combineLatest([
      this.balanceX,
      this.balanceP,
      this.balanceC,
      this.stake
    ]).pipe(
      map(([balanceX, balanceP, balanceC, stake]) => {
        const bigx = Utils.bnToBigAvaxX(balanceX)
        const bigp = Utils.bnToBigAvaxP(balanceP)
        const bigc = Utils.bnToBigAvaxC(balanceC)
        const bigs = Utils.bnToBig(stake, 9)
        const total = bigx.add(bigp).add(bigc).add(bigs);
        const symbol = 'AVAX'
        return Utils.bigToLocaleString(total, 6) + ' ' + symbol
      })
    )
  }

  onComponentMount = (): void => {
    this.addBalanceListeners(this.wallet.value)
  }

  onComponentUnMount = (): void => {
    this.removeBalanceListeners(this.wallet.value)
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
}
