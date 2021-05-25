import {MnemonicWallet, NetworkConstants} from '../wallet_sdk';
import WalletSDK from './WalletSDK';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

export default class {
  constructor(colorScheme: string) {
    this.isDarkMode.next(colorScheme === 'dark');
  }
  avaxPrice: BehaviorSubject<number> = new BehaviorSubject(0);
  isDarkMode: BehaviorSubject<boolean> = new BehaviorSubject(false);
  mnemonic: BehaviorSubject<string> = new BehaviorSubject(
    'enemy cabbage salute expire verb camera update like dirt arrest record hidden about warfare record fire hungry arch sting quality cliff inside flash list',
  );
  wallet: Observable<MnemonicWallet> = this.mnemonic.pipe(
    map(m => WalletSDK.getMnemonicValet(m)),
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
      };
    }),
  );

  onComponentMount() {
    WalletSDK.setNetwork(NetworkConstants.LocalnetConfig);
    WalletSDK.getAvaxPrice().then(value => {
      this.avaxPrice.next(value);
    });
  }
}
