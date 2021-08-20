import {BN, MnemonicWallet, Utils} from '@avalabs/avalanche-wallet-sdk';
import {useSendAvaxForm} from '@avalabs/wallet-react-components';
import {useEffect, useState} from 'react';
import {Alert} from 'react-native';
import {asyncScheduler, defer, scheduled, Subscription} from 'rxjs';

export function useSendAvax(
  wallet: MnemonicWallet,
): [
  'X' | 'C' | undefined,
  boolean,
  string,
  string,
  boolean,
  (value: ((prevState: boolean) => boolean) | boolean) => void,
  string,
  any,
  string,
  (value: ((prevState: string) => string) | string) => void,
  string,
  (memo?: string) => void,
  () => void,
  (data: string) => void,
  () => void,
] {
  const {
    address,
    setAddress,
    amount,
    setAmount,
    targetChain,
    // txId,
    error,
    //submit,
    // clearForm,
    // canSubmit,
    // extraTxs,
    // extraStatuses,
    sendFee,
    // otherFees,
    // isExecuting,
    // activeTxIndex,
  } = useSendAvaxForm(wallet);
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [loaderMsg, setLoaderMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [sendAmountString, setSendAmountString] = useState('0.00');
  const [sendFeeString, setSendFeeString] = useState('0.00');
  const [disposables] = useState(new Subscription());

  useEffect(() => {
    setErrorMsg(error);
  }, [error]);

  useEffect(() => {
    return () => disposables?.unsubscribe();
  }, [disposables]);

  useEffect(() => {
    setAmount(stringAmountToBN(sendAmountString));
  }, [sendAmountString]);

  useEffect(() => {
    setSendFeeString(bnAmountToString(sendFee));
  }, [sendFee, targetChain]);

  const onSendAvax = (memo?: string): void => {
    setLoaderVisible(true);
    setLoaderMsg('Sending...');

    const subscription = scheduled(
      defer(() => wallet.sendAvaxX(address, amount!, memo)),
      asyncScheduler,
    ).subscribe({
      next: (txHash: string) => {
        Alert.alert('Success', 'Created transaction: ' + txHash);
        setLoaderVisible(false);
      },
      error: err => {
        Alert.alert('Error', err.message);
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
    const denomination = 9; //todo magic number
    return Utils.numberToBN(amount, denomination);
  }

  function bnAmountToString(amount: BN): string {
    return Utils.bnToAvaxX(amount);
  }

  return [
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
    onSendAvax,
    onScanBarcode,
    onBarcodeScanned,
    clearAddress,
  ];
}
