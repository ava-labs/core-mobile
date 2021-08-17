import {BehaviorSubject, from, Observable} from 'rxjs';
import {delay, map, retryWhen, tap} from 'rxjs/operators';
import {iWalletAddressChanged} from '@avalabs/avalanche-wallet-sdk/dist/Wallet/types';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import WalletSDK from '../../utils/WalletSDK';

enum WalletEvents {
  AddressChanged = 'addressChanged',
}

export default class {
  avaxPrice: BehaviorSubject<number> = new BehaviorSubject(0);
  wallet: BehaviorSubject<MnemonicWallet>;
  walletCAddress: Observable<string>;
  walletEvmAddrBech: Observable<string>;
  addressX: BehaviorSubject<string>;
  addressP: BehaviorSubject<string>;
  addressC: Observable<string>;

  constructor(wallet: BehaviorSubject<MnemonicWallet>) {
    this.wallet = wallet;

    this.addressX = new BehaviorSubject<string>(
      this.wallet.value.getAddressX(),
    );
    this.addressP = new BehaviorSubject<string>(
      this.wallet.value.getAddressP(),
    );

    this.walletCAddress = this.wallet.pipe(map(wallet => wallet.getAddressC()));

    this.walletEvmAddrBech = this.wallet.pipe(
      map(wallet => wallet.getEvmAddressBech()),
    );

    this.addressC = this.wallet.pipe(map(wallet => wallet.getAddressC()));
  }

  onComponentMount = (): void => {
    this.fetchAvaxPriceWithRetryOnError();
    this.wallet.value.on(WalletEvents.AddressChanged, this.onAddressChanged);
  };

  onComponentUnMount = (): void => {
    this.wallet.value.off(WalletEvents.AddressChanged, this.onAddressChanged);
  };

  private onAddressChanged = (params: iWalletAddressChanged): void => {
    this.addressX.next(params.X);
    this.addressP.next(params.P);
  };

  private fetchAvaxPriceWithRetryOnError = (): void => {
    from(WalletSDK.getAvaxPrice())
      .pipe(
        retryWhen(errors =>
          errors.pipe(
            tap(err => console.warn(err)),
            delay(5000),
          ),
        ),
      )
      .subscribe({
        next: value => this.avaxPrice.next(value),
      });
  };
}
