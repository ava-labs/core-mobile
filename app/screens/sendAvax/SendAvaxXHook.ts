import {BN, MnemonicWallet, Utils} from '@avalabs/avalanche-wallet-sdk';
import {useSendAvaxForm} from '@avalabs/wallet-react-components';
import {useEffect, useState} from 'react';
import {Alert} from 'react-native';
import {asyncScheduler, defer, Subscription} from 'rxjs';
import {subscribeOn} from 'rxjs/operators';

export function useSendAvax(
  wallet: MnemonicWallet,
): [
  boolean,
  string,
  boolean,
  (value: ((prevState: boolean) => boolean) | boolean) => void,
  string,
  any,
  string,
  (value: ((prevState: string) => string) | string) => void,
  (addressX: string, amount: string, memo?: string) => void,
  () => void,
  (data: string) => void,
  () => void,
] {
  const {
    address,
    setAddress,
    // amount,
    // setAmount,
    // targetChain,
    // txId,
    // error,
    // submit,
    // clearForm,
    // canSubmit,
    // extraTxs,
    // extraStatuses,
    // sendFee,
    // otherFees,
    // isExecuting,
    // activeTxIndex,
  } = useSendAvaxForm(wallet);
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [loaderMsg, setLoaderMsg] = useState('');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [sendAmountString, setSendAmountString] = useState('0.00');
  const [disposables] = useState(new Subscription());

  useEffect(() => {
    return disposables.unsubscribe;
  }, [disposables]);

  const onSendAvax = (
    addressX: string,
    amount: string,
    memo?: string,
  ): void => {
    const amountBn = stringAmountToBN(amount);
    setLoaderVisible(true);
    setLoaderMsg('Sending...');
    const sub = defer(() => {
      //without this app will freeze until sendAvaxX resolves
      return wallet
        .sendAvaxX(addressX, amountBn, memo)
        .then((txHash: string) => {
          Alert.alert('Success', 'Created transaction: ' + txHash);
        })
        .catch(reason => {
          Alert.alert('Error', reason.message);
        })
        .finally(() => {
          setLoaderVisible(false);
        });
    })
      .pipe(subscribeOn(asyncScheduler))
      .subscribe();
    disposables.add(sub);
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

  return [
    loaderVisible,
    loaderMsg,
    cameraVisible,
    setCameraVisible,
    address,
    setAddress,
    sendAmountString,
    setSendAmountString,
    onSendAvax,
    onScanBarcode,
    onBarcodeScanned,
    clearAddress,
  ];
}
