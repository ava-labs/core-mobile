import {asyncScheduler, BehaviorSubject, Observable} from 'rxjs';
import {concatMap, map, subscribeOn, take} from 'rxjs/operators';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';

export default class {
  wallet: BehaviorSubject<MnemonicWallet>;

  constructor(wallet: MnemonicWallet) {
    this.wallet = new BehaviorSubject<MnemonicWallet>(wallet);
  }

  onResetHdIndices = (): Observable<boolean> => {
    return this.wallet.pipe(
      take(1),
      concatMap(wallet => wallet.resetHdIndices()),
      concatMap(() => this.wallet.value.updateUtxosX()),
      concatMap(() => this.wallet.value.updateUtxosP()),
      concatMap(() => this.wallet.value.updateAvaxBalanceC()),
      map(() => {
        this.wallet.next(this.wallet.value);
        return true;
      }),
      subscribeOn(asyncScheduler),
    );
  };
}
