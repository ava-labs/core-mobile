import React, {createContext, useEffect, useState} from 'react';
import {
  useSendAvax,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import {
  asyncScheduler,
  BehaviorSubject,
  defer,
  scheduled,
  Subscription,
} from 'rxjs';
import {BN, Utils} from '@avalabs/avalanche-wallet-sdk';
import {Alert} from 'react-native';
import {take} from 'rxjs/operators';

export interface SendAvaxContextState {
  destinationAddress: string;
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
  createdTxId: string;
  sendFeeString: string;
  errorMsg: string;
  clearErrorMsg: () => void;
  onScanBarcode: () => void;
  balanceTotalInUSD: string;
  avaxTotal: string;
  targetChain: 'X' | 'P' | 'C' | undefined;
  canSubmit: undefined | boolean;
  onSendAvax: (memo?: string) => void;
  onBarcodeScanned: (data: string) => void;
}

export const SendAvaxContext = createContext<SendAvaxContextState>({} as any);

export const SendAvaxContextProvider = ({children}: {children: any}) => {
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
    txs,
    sendFee,
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
  const [destinationAddress, setDestinationAddress] = useState('');
  const [createdTxId, setCreatedTxId] = useState('');

  useEffect(() => {
    if (!walletStateContext) {
      return;
    }
    setAvaxPrice(walletStateContext.avaxPrice);
    setBalanceAvaxTotal(walletStateContext.balances.balanceAvaxTotal);
  }, [walletStateContext]);

  useEffect(() => {
    setErrorMsg(error?.message ?? '');
  }, [error]);

  useEffect(() => {
    return () => disposables?.unsubscribe();
  }, [disposables]);

  useEffect(() => {
    setAmount(stringAmountToBN(sendAmountString));
  }, [sendAmountString]);

  useEffect(() => {
    setDestinationAddress(address ?? '');
  }, [address]);

  useEffect(() => {
    if (sendFee) {
      setSendFeeString(bnAmountToString(sendFee));
    }
  }, [sendFee]);

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
          console.log('submit result:', value);
          if (value === undefined) {
            Alert.alert('Error', 'Undefined error');
          } else {
            if ('txId' in value && value.txId) {
              setCreatedTxId(value.txId);
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

  const clearErrorMsg = (): void => {
    setErrorMsg('');
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

  const state: SendAvaxContextState = {
    avaxTotal,
    balanceTotalInUSD,
    targetChain,
    loaderVisible,
    loaderMsg,
    errorMsg,
    clearErrorMsg,
    cameraVisible,
    setCameraVisible,
    destinationAddress,
    setAddress,
    sendAmountString,
    setSendAmountString,
    sendFeeString,
    canSubmit,
    onSendAvax,
    onScanBarcode,
    onBarcodeScanned,
    clearAddress,
    createdTxId,
  };
  return (
    <SendAvaxContext.Provider value={state}>
      {children}
    </SendAvaxContext.Provider>
  );
};
