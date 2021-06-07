import {MnemonicWallet, Utils} from '../../wallet_sdk'
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {AssetBalanceP, AssetBalanceX} from '../../wallet_sdk/Wallet/types';
import {map, tap} from 'rxjs/operators';

export enum Chain {
  X = 0,
  P,
  C,
}

export class ChainRenderItem {
  chain: Chain
  displayString: string

  constructor(chain: Chain, displayString: string) {
    this.chain = chain
    this.displayString = displayString
  }
}

export default class {
  private wallet!: BehaviorSubject<MnemonicWallet>
  availableSourceChains: Chain[] = [Chain.X, Chain.P, Chain.C]
  availableDestinationChains!: Observable<Chain[]>
  sourceChain: BehaviorSubject<Chain> = new BehaviorSubject<Chain>(Chain.X)
  destinationChain: BehaviorSubject<Chain> = new BehaviorSubject<Chain>(Chain.P)
  balance: Observable<string>

  constructor(wallet: MnemonicWallet) {
    this.wallet = new BehaviorSubject<MnemonicWallet>(wallet)

    this.availableDestinationChains = this.sourceChain.pipe(
      map(srcChain => {
        switch (srcChain) {
          case Chain.X:
            return [Chain.P, Chain.C]
          case Chain.P:
          case Chain.C:
            return [Chain.X]
        }
      }),
      tap(availableChains => this.setDestinationChain(availableChains[0]))
    )

    this.balance = this.sourceChain.pipe(
      map(srcChain => {
        switch (srcChain) {
          case Chain.X:
            const assetBalanceX: AssetBalanceX = this.wallet.value.getAvaxBalanceX()
            return Utils.bnToAvaxX(assetBalanceX.unlocked) + ' ' + assetBalanceX.meta.symbol
          case Chain.P:
            const assetBalanceP: AssetBalanceP = this.wallet.value.getAvaxBalanceP()
            return Utils.bnToAvaxP(assetBalanceP.unlocked) + ' AVAX'
          case Chain.C:
            const balanceC = this.wallet.value.evmWallet.balance
            return Utils.bnToAvaxC(balanceC) + ' AVAX'
        }
      })
    )
  }

  setSourceChain(chain: Chain): void {
    this.sourceChain.next(chain)
  }

  setDestinationChain(chain: Chain): void {
    this.destinationChain.next(chain)
  }

  getChainString(chain: Chain): string {
    switch (chain) {
      case Chain.X:
        return 'X Chain (Exchange)'
      case Chain.P:
        return 'P Chain (Platform)'
      case Chain.C:
        return 'C Chain (Contract)'
    }
  }

  getChainRenderItems(chains: Chain[]): ChainRenderItem[] {
    return chains.map(chain => new ChainRenderItem(chain, this.getChainString(chain)))
  }
}
