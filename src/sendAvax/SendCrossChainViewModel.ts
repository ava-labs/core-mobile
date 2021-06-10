import {BN} from 'avalanche';
import {MnemonicWallet, Utils} from '../../wallet_sdk'
import {asyncScheduler, BehaviorSubject, concat, defer, Observable, of} from 'rxjs';
import {AssetBalanceP, AssetBalanceX} from '../../wallet_sdk/Wallet/types';
import {count, map, tap} from 'rxjs/operators';

export enum Chain {
  X = 'X',
  P = 'P',
  C = 'C',
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
  loaderVisible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  loaderMsg: BehaviorSubject<string> = new BehaviorSubject<string>("")

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

  makeTransfer(srcChain: Chain, destChain: Chain, amount: string): Observable<number> {
    const denomination = 9
    const bnAmount = Utils.numberToBN(amount, denomination)
    const exportOp: Observable<string> = this.getExportOpForSrcDestPair(srcChain, bnAmount, destChain)
    const importOp: Observable<string> = this.getImportOpForSrcDestPair(destChain, srcChain)
    return concat(of("startLoader"), exportOp, importOp, asyncScheduler).pipe(
      count((value: string, index: number) => {
        this.setLoaderVisibilityAndMsg(index, srcChain, destChain)
        return true
      }),
      tap({
        complete: () => this.loaderVisible.next(false),
        error: err => this.loaderVisible.next(false)
      })
    )
  }

  private setLoaderVisibilityAndMsg(index: number, srcChain: Chain, destChain: Chain) {
    switch (index) {
      case 0:
        this.loaderMsg.next("Exporting " + srcChain + " chain...")
        break
      case 1:
        this.loaderMsg.next("Importing " + destChain + " chain...")
        break
    }
    this.loaderVisible.next(true)
  }

  private getImportOpForSrcDestPair(destChain: Chain, srcChain: Chain) {
    let importOp: Observable<string>
    switch (destChain) {
      case Chain.X:
        importOp = defer(() => this.wallet.value.importX(<'P' | 'C'>srcChain.toString()))
        break;
      case Chain.P:
        importOp = defer(() => this.wallet.value.importP())
        break;
      case Chain.C:
        importOp = defer(() => this.wallet.value.importC())
        break;
    }
    return importOp
  }

  private getExportOpForSrcDestPair(srcChain: Chain, bnAmount: BN, destChain: Chain) {
    let exportOp: Observable<string>
    switch (srcChain) {
      case Chain.X:
        exportOp = defer(() => this.wallet.value.exportXChain(bnAmount, <'P' | 'C'>destChain.toString()))
        break;
      case Chain.P:
        exportOp = defer(() => this.wallet.value.exportPChain(bnAmount))
        break;
      case Chain.C:
        exportOp = defer(() => this.wallet.value.exportCChain(bnAmount))
        break;
    }
    return exportOp
  }
}
