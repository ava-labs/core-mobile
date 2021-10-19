import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import {AntWithBalance, useSendAnt} from '@avalabs/wallet-react-components';
import {asyncScheduler, defer, from, scheduled, Subscription} from 'rxjs';
import {BN, Utils} from '@avalabs/avalanche-wallet-sdk';
import {Alert} from 'react-native';
import {take} from 'rxjs/operators';

export interface SendANTContextState {
  sendAmountString: string;
  errorMsg: string;
  clearErrorMsg: () => void;
  setSendAmountString: Dispatch<SetStateAction<string>>;
  sendFeeString: string;
  setAddress: Dispatch<string>;
  destinationAddress: string;
  onScanBarcode: () => void;
  canSubmit: boolean | undefined;
  loaderVisible: boolean;
  loaderMsg: string;
  setCameraVisible: Dispatch<SetStateAction<boolean>>;
  cameraVisible: boolean;
  onBarcodeScanned: Dispatch<string>;
  onSendANT: () => void;
  createdTxId: string;
  clearAddress: () => void;
}

export const SendANTContext = createContext<SendANTContextState>({} as any);

export const SendANTContextProvider = ({
  antToken,
  children,
}: {
  antToken: AntWithBalance;
  children: any;
}) => {
  const {
    sendFee,
    address,
    amount,
    token,
    extraTxs,
    extraFees,
    canSubmit,
    error,
    txs,
    txId,
    submit,
    reset,
    setAddress,
    setAmount,
  } = useSendAnt(antToken);
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [loaderMsg, setLoaderMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [sendAmountString, setSendAmountString] = useState('');
  const [sendFeeString, setSendFeeString] = useState('0.00');
  const [disposables] = useState(new Subscription());
  const [destinationAddress, setDestinationAddress] = useState('');
  const [createdTxId, setCreatedTxId] = useState('');

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

  const onSendANT = (): void => {
    setLoaderVisible(true);
    setLoaderMsg('Sending...');

    if (!address) {
      Alert.alert('Error', 'Address not set ');
      return;
    }
    if (!amount || amount.isZero()) {
      Alert.alert('Error', 'Amount not set ');
      return;
    }
    const subscription = scheduled(
      defer(() => from(submit())),
      asyncScheduler,
    )
      .pipe(take(1))
      .subscribe({
        next: (txId: unknown) => {
          const txIdStr = txId as string | undefined;
          if (txIdStr === undefined) {
            Alert.alert('Error', 'Undefined error');
          } else {
            setCreatedTxId(txIdStr);
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
    try {
      return Utils.numberToBN(amount, antToken.denomination);
    } catch (e) {
      return new BN(0);
    }
  }

  function bnAmountToString(amount: BN): string {
    return Utils.bnToAvaxX(amount) + ' AVAX';
  }

  const state: SendANTContextState = {
    sendAmountString,
    errorMsg,
    clearErrorMsg,
    setSendAmountString,
    sendFeeString,
    setAddress,
    destinationAddress,
    onScanBarcode,
    canSubmit,
    loaderVisible,
    loaderMsg,
    setCameraVisible,
    cameraVisible,
    onBarcodeScanned,
    onSendANT,
    createdTxId,
    clearAddress,
  };
  return (
    <SendANTContext.Provider value={state}>{children}</SendANTContext.Provider>
  );
};
