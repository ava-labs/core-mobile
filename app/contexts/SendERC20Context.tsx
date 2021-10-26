import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import {
  ERC20,
  sendErc20Submit,
  useSendErc20Form,
  useWalletContext,
} from '@avalabs/wallet-react-components';
import {
  asyncScheduler,
  defer,
  firstValueFrom,
  scheduled,
  Subscription,
} from 'rxjs';
import {BN, Utils} from '@avalabs/avalanche-wallet-sdk';
import {Alert} from 'react-native';
import {take} from 'rxjs/operators';
import {useGasPrice} from 'utils/GasPriceHook';

export interface SendERC20ContextState {
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
  onSendErc20: () => void;
  createdTxId: string;
  clearAddress: () => void;
}

export const SendERC20Context = createContext<SendERC20ContextState>({} as any);

export const SendERC20ContextProvider = ({
  erc20Token,
  children,
}: {
  erc20Token: ERC20;
  children: any;
}) => {
  const {gasPrice$} = useGasPrice();
  const {
    setTokenBalances,
    setAmount,
    setAddress,
    canSubmit,
    error,
    sendFee,
    amount,
    address,
  } = useSendErc20Form(erc20Token, gasPrice$);
  const wallet = useWalletContext()?.wallet;
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
    setTokenBalances({[erc20Token.address]: erc20Token});
  }, []);

  useEffect(() => {
    if (error?.message && error?.message !== 'address undefined') {
      setErrorMsg(error.message);
    } else {
      setErrorMsg('');
    }
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

  const onSendErc20 = (): void => {
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
      defer(() =>
        sendErc20Submit(
          erc20Token,
          Promise.resolve(wallet),
          amount,
          address,
          firstValueFrom(gasPrice$),
        ),
      ),
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
    try {
      return Utils.numberToBN(amount, erc20Token.denomination);
    } catch (e) {
      return new BN(0);
    }
  }

  function bnAmountToString(amount: BN): string {
    return Utils.bnToAvaxX(amount) + ' AVAX';
  }

  const state: SendERC20ContextState = {
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
    onSendErc20,
    createdTxId,
    clearAddress,
  };
  return (
    <SendERC20Context.Provider value={state}>
      {children}
    </SendERC20Context.Provider>
  );
};
