import {MnemonicWallet, NetworkConstants, Utils} from '../wallet_sdk';
import WalletSDK from './WalletSDK';
import {asyncScheduler, BehaviorSubject, Observable, of, zip} from 'rxjs';
import {concatMap, filter, map, subscribeOn, take} from 'rxjs/operators';
import {AssetBalanceP, AssetBalanceX} from "../wallet_sdk/Wallet/types";

export default class {
  hdIndicesSet: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  avaxPrice: BehaviorSubject<number> = new BehaviorSubject(0);
  mnemonic: string =
    'capable maze trophy install grunt close left visa cheap tilt elder end mosquito culture south stool baby animal donate creek outer learn kitten tonight';
  wallet: BehaviorSubject<MnemonicWallet> = new BehaviorSubject<MnemonicWallet>(
    WalletSDK.getMnemonicValet(this.mnemonic),
  );
  walletCAddress: Observable<string> = this.wallet.pipe(
    map(wallet => wallet.getAddressC()),
  );
  walletEvmAddrBech: Observable<string> = this.wallet.pipe(
    map(wallet => wallet.getEvmAddressBech()),
  );
  externalAddressesX: Observable<string[]> = this.wallet.pipe(
    map(wallet => wallet.getExternalAddressesX()),
  );
  externalAddressesP: Observable<string[]> = this.wallet.pipe(
    map(wallet => wallet.getExternalAddressesP()),
  );
  addressC: Observable<string> = this.wallet.pipe(
    map(wallet => wallet.getAddressC()),
  );
  private avaxBalanceX: Observable<AssetBalanceX> = this.hdIndicesSet.pipe(
    filter(hdIndicesSet => hdIndicesSet === true),
    map(
      () => this.wallet.value.getAvaxBalanceX(),
    ),
  );
  private avaxBalanceP: Observable<AssetBalanceP> = this.hdIndicesSet.pipe(
    filter(hdIndicesSet => hdIndicesSet === true),
    map(
      () => this.wallet.value.getAvaxBalanceP(),
    ),
  );
  availableX: Observable<string> = this.avaxBalanceX.pipe(
      filter(assetBalance => assetBalance !== undefined),
      map(assetBalance => {
        return Utils.bnToAvaxX(assetBalance.unlocked) + ' ' + assetBalance.meta.symbol
      })
  )
  availableP: Observable<string> = this.avaxBalanceP.pipe(
      filter(assetBalance => assetBalance !== undefined),
      map(assetBalance => {
        const symbol = 'AVAX'
        return Utils.bnToAvaxP(assetBalance.unlocked) + ' ' + symbol
      })
  )
  availableC: Observable<string> = this.wallet.pipe(
      concatMap(wallet => wallet.evmWallet.updateBalance()),
      map(balance => {
        const symbol = 'AVAX'
        return Utils.bnToAvaxC(balance) + ' ' + symbol
      })
  )

  onComponentMount(): void {
    WalletSDK.setNetwork(NetworkConstants.TestnetConfig);
    WalletSDK.getAvaxPrice()
      .then(value => {
        this.avaxPrice.next(value);
      })
      .catch(reason => console.log(reason));
  }

  onResetHdIndices(): void {
    console.log('reset indices');
    this.wallet
      .pipe(
        take(1),
        concatMap(wallet => wallet.resetHdIndices()),
        concatMap(() => this.wallet.value.getUtxosX()),
        concatMap(() => this.wallet.value.getUtxosP()),
        subscribeOn(asyncScheduler),
      )
      .subscribe({
        next: value => console.log(value),
        error: err => console.error(err),
        complete: () => {
          this.hdIndicesSet.next(true);
          this.wallet.next(this.wallet.value);
        },
      });
  }
}
