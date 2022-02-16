import React, {
  createContext,
  Dispatch,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ERC20,
  ERC20WithBalance,
  SendHookError,
  TokenWithBalance,
  useAccountsContext,
  useWalletContext,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import {Alert, Image} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {
  bnToAvaxC,
  bnToBig,
  numberToBN,
  stringToBN,
} from '@avalabs/avalanche-wallet-sdk';
import {GasPrice, useGasPrice} from 'utils/GasPriceHook';
import {mustNumber, mustValue} from 'utils/JsTools';
import {BN} from 'avalanche';
import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  map,
  Observable,
  of,
  Subject,
} from 'rxjs';
import {useSend} from 'screens/send/useSend';
import {FeePreset} from 'components/NetworkFeeSelector';

export enum TokenType {
  AVAX,
  ERC20,
  ANT,
}

export interface SendTokenContextState {
  sendToken: TokenWithBalance | undefined;
  setSendToken: Dispatch<ERC20WithBalance | undefined>;
  sendAmount: string;
  setSendAmount: Dispatch<string>;
  fromAccount: Account;
  toAccount: Account;
  tokenLogo: () => JSX.Element;
  tokenType: (token?: TokenWithBalance) => TokenType | undefined;
  fees: Fees;
  canSubmit: boolean;
  sendStatus: 'Idle' | 'Sending' | 'Success' | 'Fail';
  sendStatusMsg: string;
  onSendNow: () => void;
  transactionId: string | undefined;
  sdkError: SendHookError | undefined;
}

export const SendTokenContext = createContext<SendTokenContextState>({} as any);

/**
 * These are mappings from preset to multiplier
 */
const gasPresets = {
  [FeePreset.Normal]: 1,
  [FeePreset.Fast]: 1.05,
  [FeePreset.Instant]: 1.15,
  [FeePreset.Custom]: 0,
};

const tokenType = (token?: TokenWithBalance) => {
  if (token === undefined) {
    return undefined;
  } else if (token.isAvax) {
    return TokenType.AVAX;
  } else if (token.isErc20) {
    return TokenType.ERC20;
  } else if (token.isAnt) {
    return TokenType.ANT;
  } else {
    return undefined;
  }
};

/**
 * This observable emits gas price that is actually used on all UI calculations and will be used
 * for finalizing transaction.
 * @param originGasPrice$ - current network's gas price
 * @param selectedGasPreset$ - selected preset; See {@link gasPresets}
 * @param customGasPrice$ - user's entered gas price
 */
const finalGasPrice = (
  originGasPrice$: Observable<GasPrice>,
  selectedGasPreset$ = of<FeePreset>(FeePreset.Normal),
  customGasPrice$ = of(new BN(0)),
) => {
  return combineLatest([
    originGasPrice$,
    selectedGasPreset$,
    customGasPrice$,
  ]).pipe(
    map(([originGasPrice, selectedGasPreset, customGasPrice]) => {
      if (selectedGasPreset === FeePreset.Custom) {
        return {
          bn: customGasPrice,
          value: '',
        } as GasPrice;
      } else {
        const multiplier = gasPresets[selectedGasPreset];
        if (multiplier) {
          return {
            bn: originGasPrice.bn.muln(multiplier),
            value: '',
          } as GasPrice;
        } else {
          return originGasPrice;
        }
      }
    }),
  );
};

export const SendTokenContextProvider = ({children}: {children: any}) => {
  const {theme, repo} = useApplicationContext();
  const {wallet} = useWalletContext();
  const {activeAccount} = useAccountsContext();
  const {avaxPrice, erc20Tokens} = useWalletStateContext()!;
  const [sendToken, setSendToken] = useState<TokenWithBalance | undefined>(
    undefined,
  );

  const selectedGasPricePreset$ = useMemo(
    () => new BehaviorSubject<FeePreset>(FeePreset.Normal),
    [],
  );
  const originGasPrice = useGasPrice().gasPrice$;
  const customGasPrice$ = useMemo(() => new BehaviorSubject(new BN(0)), []);
  const finalGasPrice$ = useMemo(
    () =>
      finalGasPrice(originGasPrice, selectedGasPricePreset$, customGasPrice$),
    [originGasPrice],
  );

  const {
    submit,
    setAmount,
    amount,
    setAddress,
    address,
    canSubmit,
    sendFee,
    setTokenBalances,
    gasLimit,
    setGasLimit,
    reset,
    error,
  } = useSend(sendToken, finalGasPrice$);
  useEffect(() => {
    console.log('reset context');
    reset(); //todo: this won't reset gas limit set with "setGasLimit"
  }, []);

  const [sendAmount, setSendAmount] = useState('0');
  const [sendToAddress, setSendToAddress] = useState('');
  const [sendToTitle, setSendToTitle] = useState('');

  //GAS - we have finalGasPrice$ which depends on selectedGasPricePreset, but
  // if we set customGasPriceNanoAvax => gasPriceNAvax, we would prefer that over
  const [customGasPriceNanoAvax, setCustomGasPriceNanoAvax] = useState('0');
  useEffect(() => {
    customGasPrice$.next(
      mustValue(
        () =>
          numberToBN(
            mustNumber(() => parseFloat(customGasPriceNanoAvax), 0),
            9,
          ),
        new BN(0),
      ),
    );
  }, [customGasPriceNanoAvax]);

  const [selectedGasPricePreset, setSelectedGasPricePreset] =
    useState<FeePreset>(FeePreset.Normal);
  useEffect(() => {
    selectedGasPricePreset$.next(selectedGasPricePreset);
  }, [selectedGasPricePreset]);

  const [sendStatus, setSendStatus] = useState<
    'Idle' | 'Sending' | 'Success' | 'Fail'
  >('Idle');
  const [sendStatusMsg, setSendStatusMsg] = useState('');

  const [transactionId, setTransactionId] = useState<string>();

  const balanceAfterTrx = useMemo(
    () =>
      bnToBig(
        sendToken?.balance.sub(amount ?? new BN(0)).sub(sendFee ?? new BN(0)) ??
          new BN(0),
        sendToken?.denomination,
      ).toFixed(4),
    [sendFee, amount],
  );
  const balanceAfterTrxUsd = useMemo(
    () =>
      (avaxPrice * mustNumber(() => parseFloat(balanceAfterTrx), 0)).toFixed(2),
    [balanceAfterTrx],
  );
  const sendFromAddress = useMemo(
    () => activeAccount!.wallet.getAddressC(),
    [activeAccount],
  );
  const sendFromTitle = useMemo(
    () =>
      repo.accountsRepo.accounts.get(activeAccount?.index ?? -1)?.title ?? '-',
    [activeAccount],
  );
  const sendFeeAvax = useMemo(
    () => (sendFee ? bnToAvaxC(sendFee) : undefined),
    [sendFee],
  );
  const sendFeeUsd = useMemo(
    () =>
      sendFeeAvax ? Number.parseFloat(sendFeeAvax) * avaxPrice : undefined,
    [sendFeeAvax, avaxPrice],
  );

  useEffect(() => {
    if (sendToken?.isErc20) {
      setTokenBalances?.({[(sendToken as ERC20).address]: sendToken as ERC20});
    }
  }, [sendToken]);

  useEffect(() => {
    setAmount(
      mustValue(
        () => stringToBN(sendAmount, sendToken?.denomination ?? 0),
        new BN(0),
      ),
    );
  }, [sendAmount, sendToken]);

  useEffect(() => {
    setAddress(sendToAddress);
  }, [sendToAddress, sendToken]);

  function onSendNow() {
    console.log('onsend now');
    setTransactionId(undefined);
    setSendStatus('Sending');

    const balances = erc20Tokens.reduce(
      (acc: {[key: string]: ERC20WithBalance}, tk) => {
        return {
          ...acc,
          [tk.address]: tk,
        };
      },
      {},
    );

    submit?.(
      sendToken?.isErc20 ? (sendToken as ERC20) : undefined,
      Promise.resolve(wallet),
      amount!,
      address!,
      firstValueFrom(finalGasPrice$),
      of(balances) as Subject<any>,
      gasLimit,
    ).subscribe({
      next: value => {
        if (value === undefined) {
          Alert.alert('Error', 'Undefined error');
        } else {
          if ('txId' in value && value.txId) {
            setTransactionId(value.txId);
            setSendStatus('Success');
            console.log('send success', value.txId);
          }
        }
      },
      error: err => {
        setSendStatus('Fail');
        setSendStatusMsg(err);
        console.log('send err', err);
      },
    });
  }

  const tokenLogo = useCallback(() => {
    if (sendToken?.isAvax) {
      return (
        <AvaLogoSVG
          backgroundColor={theme.logoColor}
          logoColor={theme.white}
          size={57}
        />
      );
    } else {
      return (
        <Image
          style={{width: 57, height: 57}}
          source={{
            uri: sendToken?.logoURI,
          }}
        />
      );
    }
  }, [sendToken, theme]);

  const state: SendTokenContextState = {
    sendToken,
    setSendToken,
    sendAmount,
    setSendAmount,
    fromAccount: {
      address: sendFromAddress,
      title: sendFromTitle,
      balanceAfterTrx,
      balanceAfterTrxUsd,
    },
    toAccount: {
      title: sendToTitle,
      address: sendToAddress,
      setTitle: setSendToTitle,
      setAddress: setSendToAddress,
    },
    fees: {
      gasPresets,
      selectedGasPricePreset,
      setSelectedGasPricePreset,
      sendFeeAvax,
      sendFeeUsd,
      customGasPriceNanoAvax,
      setCustomGasPriceNanoAvax,
      gasLimit,
      setGasLimit,
    },
    tokenLogo,
    tokenType,
    canSubmit: canSubmit ?? false,
    sendStatus,
    sendStatusMsg,
    onSendNow,
    transactionId,
    sdkError: error,
  };
  return (
    <SendTokenContext.Provider value={state}>
      {children}
    </SendTokenContext.Provider>
  );
};

export function useSendTokenContext() {
  return useContext(SendTokenContext);
}

export interface Account {
  title: string;
  setTitle?: Dispatch<string>;
  address: string;
  setAddress?: Dispatch<string>;
  balanceAfterTrx?: string;
  balanceAfterTrxUsd?: string;
}

export interface Fees {
  gasPresets: {Normal: number; Fast: number; Instant: number; Custom: number};
  selectedGasPricePreset: FeePreset;
  setSelectedGasPricePreset: Dispatch<FeePreset>;
  sendFeeAvax: string | undefined;
  sendFeeUsd: number | undefined;
  customGasPriceNanoAvax: string;
  setCustomGasPriceNanoAvax: Dispatch<string>;
  gasLimit: number | undefined;
  setGasLimit: Dispatch<number>;
}
