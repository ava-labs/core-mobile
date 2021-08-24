import {from, Subscription} from 'rxjs';
import {delay, retryWhen, tap} from 'rxjs/operators';
import {iWalletAddressChanged} from '@avalabs/avalanche-wallet-sdk/dist/Wallet/types';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import WalletSDK from '../../utils/WalletSDK';
import {useEffect, useState} from 'react';

enum WalletEvents {
  AddressChanged = 'addressChanged',
}

export function usePortfolio(
  w: MnemonicWallet,
): [number, string, string, string, string, string] {
  const [wallet] = useState(w);
  const [avaxPrice, setAvaxPrice] = useState(0);
  const [walletCAddress, setWalletCAddress] = useState('');
  const [walletEvmAddrBech, setWalletEvmAddrBech] = useState('');
  const [addressX, setAddressX] = useState('');
  const [addressP, setAddressP] = useState('');
  const [addressC, setAddressC] = useState('');

  useEffect(() => {
    const subscription = fetchAvaxPriceWithRetryOnError();
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setAddressX(wallet.getAddressX());
    setAddressP(wallet.getAddressP());
    setAddressC(wallet.getAddressC());
    setWalletCAddress(wallet.getAddressC());
    setWalletEvmAddrBech(wallet.getEvmAddressBech());

    wallet.on(WalletEvents.AddressChanged, onAddressChanged);

    return () => {
      wallet.off(WalletEvents.AddressChanged, onAddressChanged);
    };
  }, [wallet]);

  function fetchAvaxPriceWithRetryOnError(): Subscription {
    return from(WalletSDK.getAvaxPrice())
      .pipe(
        retryWhen(errors =>
          errors.pipe(
            tap(err => console.warn(err)),
            delay(5000),
          ),
        ),
      )
      .subscribe({
        next: value => setAvaxPrice(value),
      });
  }

  function onAddressChanged(params: iWalletAddressChanged): void {
    setAddressX(params.X);
    setAddressP(params.P);
  }

  return [
    avaxPrice,
    walletCAddress,
    walletEvmAddrBech,
    addressX,
    addressP,
    addressC,
  ];
}
