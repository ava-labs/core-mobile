import {BN, MnemonicWallet, Utils} from '@avalabs/avalanche-wallet-sdk';
import {
  useSendAvax,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import {useEffect, useState} from 'react';
import {Alert} from 'react-native';
import {
  asyncScheduler,
  BehaviorSubject,
  defer,
  scheduled,
  Subscription,
} from 'rxjs';
import {take} from 'rxjs/operators';

export function useSendAvaxX(wallet: MnemonicWallet): {
  address: string | undefined;
  setSendAmountString: (
    value: ((prevState: string) => string) | string,
  ) => void;
  setAddress: (address: string) => void;
  cameraVisible: boolean;
  loaderMsg: string;
  loaderVisible: boolean;
  setCameraVisible: (
    value: ((prevState: boolean) => boolean) | boolean,
  ) => void;
  sendAmountString: string;
  clearAddress: () => void;
  sendFeeString: string;
  errorMsg: string;
  onScanBarcode: () => void;
  balanceTotalInUSD: string;
  avaxTotal: string;
  targetChain: 'X' | 'P' | 'C' | undefined;
  canSubmit: undefined | boolean;
  onSendAvax: (memo?: string) => void;
  onBarcodeScanned: (data: string) => void;
} {
  const {
    submit,
    reset,
    setAmount,
    setAddress,
    amount,
    address,
    targetChain,
    error,
    canSubmit,
  } = useSendAvax(new BehaviorSubject({bn: new BN(0)})); //Fixme: how is this gas used? where that should come from?

  const [loaderVisible, setLoaderVisible] = useState(false);
  const [loaderMsg, setLoaderMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [sendAmountString, setSendAmountString] = useState('');
  const [sendFeeString, setSendFeeString] = useState('0.00');
  const [disposables] = useState(new Subscription());
  const walletStateContext = useWalletStateContext();
  const [avaxPrice, setAvaxPrice] = useState(0);
  const [balanceAvaxTotal, setBalanceAvaxTotal] = useState<BN>(new BN(0));
  const [balanceTotalInUSD, setBalanceTotalInUSD] = useState('');
  const [avaxTotal, setAvaxTotal] = useState('');

  useEffect(() => {
    if (!walletStateContext) {
      return;
    }
    setAvaxPrice(walletStateContext.avaxPrice);
    setBalanceAvaxTotal(walletStateContext.balances.balanceAvaxTotal);
  }, [walletStateContext]);

  useEffect(() => {
    setErrorMsg(error ?? '');
  }, [error]);

  useEffect(() => {
    return () => disposables?.unsubscribe();
  }, [disposables]);

  useEffect(() => {
    setAmount(stringAmountToBN(sendAmountString));
  }, [sendAmountString]);

  // useEffect(() => {
  //   setSendFeeString(bnAmountToString(sendFee));
  // }, [sendFee, targetChain]);

  useEffect(() => {
    setAvaxTotal(bnAmountToString(balanceAvaxTotal));
    const symbol = 'USD';
    const total =
      parseFloat(Utils.bnToLocaleString(balanceAvaxTotal, 9)) * avaxPrice;
    setBalanceTotalInUSD(total.toFixed(2) + ' ' + symbol);
  }, [avaxPrice, balanceAvaxTotal]);

  const onSendAvax = (memo?: string): void => {
    setLoaderVisible(true);
    setLoaderMsg('Sending...');

    if (!address) {
      Alert.alert('Error', 'Address not set ');
      return;
    }
    const subscription = scheduled(
      defer(() => submit()),
      asyncScheduler,
    )
      .pipe(take(1))
      .subscribe({
        next: value => {
          if (value === undefined) {
            Alert.alert('Error', 'Undefined error');
          } else if (typeof value === 'string') {
            Alert.alert('Success', value);
          } else {
            if ('complete' in value) {
              console.log('complete', value.complete);
            }
            if ('activeTxIndex' in value) {
              Alert.alert(
                'Success',
                'Active tx index = ' + value.activeTxIndex,
              );
            }
          }
        },
        error: err => {
          Alert.alert('Error', err.message);
          setLoaderVisible(false);
        },
        complete: () => {
          setLoaderVisible(false);
        },
      });
    disposables.add(subscription);
  };

  const onScanBarcode = (): void => {
    setCameraVisible(true);
  };

  const onBarcodeScanned = (data: string): void => {
    setCameraVisible(false);
    setAddress(data);
  };

  const clearAddress = (): void => {
    setAddress('');
  };

  function stringAmountToBN(amount: string): BN {
    if (!amount) {
      return new BN(0);
    }
    const denomination = 9; //todo magic number
    try {
      return Utils.numberToBN(amount, denomination);
    } catch (e) {
      return new BN(0);
    }
  }

  function bnAmountToString(amount: BN): string {
    return Utils.bnToAvaxX(amount) + ' AVAX';
  }

  return {
    avaxTotal,
    balanceTotalInUSD,
    targetChain,
    loaderVisible,
    loaderMsg,
    errorMsg,
    cameraVisible,
    setCameraVisible,
    address,
    setAddress,
    sendAmountString,
    setSendAmountString,
    sendFeeString,
    canSubmit,
    onSendAvax,
    onScanBarcode,
    onBarcodeScanned,
    clearAddress,
  };
}
