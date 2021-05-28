import {MnemonicWallet, NetworkConstants} from '../wallet_sdk';
import WalletSDK from './WalletSDK';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {asyncScheduler, BehaviorSubject, Observable} from 'rxjs';
import {concatMap, filter, map, subscribeOn, take} from 'rxjs/operators';
import {StatusBar} from 'react-native';

export default class {
  constructor(colorScheme: string) {
    this.isDarkMode.next(colorScheme === 'dark');
  }
  hdIndicesSet: BehaviorSubject<boolean> = new BehaviorSubject(false);
  avaxPrice: BehaviorSubject<number> = new BehaviorSubject(0);
  isDarkMode: BehaviorSubject<boolean> = new BehaviorSubject(false);
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
  backgroundStyle: Observable<object> = this.isDarkMode.pipe(
    map(isDarkMode => {
      return {
        backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
        flex: 1,
        paddingTop: StatusBar.currentHeight,
      };
    }),
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
  availableX: Observable<string> = this.hdIndicesSet.pipe(
    filter(hdIndicesSet => hdIndicesSet === true),
    concatMap(() => this.wallet.value.getUtxosX()),
    concatMap(() => this.wallet),
    map(
      wallet => wallet.getAvaxBalanceX()?.unlocked.toNumber().toFixed(2) ?? '-',
    ),
  );

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
        subscribeOn(asyncScheduler),
      )
      .subscribe({
        next: value => console.log(value),
        error: err => console.log(err),
        complete: () => {
          this.hdIndicesSet.next(true);
          this.wallet.next(this.wallet.value);
        },
      });
  }
}
