import {
  filter,
  interval,
  map,
  pairwise,
  switchMap,
  tap,
} from 'rxjs';
import {BN, bnToLocaleString, GasHelper} from '@avalabs/avalanche-wallet-sdk';
import {useEffect, useState} from 'react';

export interface GasPrice {
  bn: BN;
  value: string;
}

const SECONDS_30 = 1000 * 10;

export function useGasPrice(): {
  gasPrice: GasPrice;
} {
  const [gasPrice, setGasPrice] = useState({
    bn: new BN(0),
    value: '',
  } as GasPrice);

  useEffect(() => {
    getGasPrice()
      .then(parseGasPrice)
      .then(res => setGasPrice(res));

    const subscription = interval(SECONDS_30)
      .pipe(
        switchMap(() => getGasPrice()),
        pairwise(),
        filter(
          ([oldPrice, newPrice]) => oldPrice.toString() !== newPrice.toString(),
        ),
        map(([_, newPrice]) => parseGasPrice(newPrice)),
        tap((res: any) => {
          setGasPrice(res);
        }),
      )
      .subscribe();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return {
    gasPrice,
  };
}

function getGasPrice(): Promise<BN> {
  return GasHelper.getGasPrice();
}

function parseGasPrice(bn: BN) {
  const value = bnToLocaleString(bn, 9);
  return {
    bn,
    value,
  };
}
