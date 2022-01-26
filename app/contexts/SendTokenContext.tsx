import React, {
  createContext,
  Dispatch,
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
import {Big, Utils} from '@avalabs/avalanche-wallet-sdk';
import {useGasPrice} from 'utils/GasPriceHook';
import {mustNumber, mustValue} from 'utils/JsTools';
import {BN} from 'avalanche';
import {firstValueFrom, of, tap} from 'rxjs';
import {useSend} from 'screens/send/useSend';

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
  canSubmit: boolean;
  sendFeeAvax: string | undefined;
  sendFeeUsd: number | undefined;
  gasPresets: {Normal: string; Fast: string; Instant: string; Custom: string};
  setSendGasPrice: Dispatch<string>;
  sendStatus: 'Idle' | 'Sending' | 'Success' | 'Fail';
  error: SendHookError | undefined;
  onSendNow: () => void;
  transactionId: string | undefined;
}

export const SendTokenContext = createContext<SendTokenContextState>({} as any);

export const SendTokenContextProvider = ({children}: {children: any}) => {
  const {theme, repo} = useApplicationContext();
  const {wallet} = useWalletContext();
  const {activeAccount} = useAccountsContext();
  const {avaxPrice, erc20Tokens} = useWalletStateContext()!;
  const {gasPrice$} = useGasPrice();
  const [sendToken, setSendToken] = useState<TokenWithBalance | undefined>(
    undefined,
  );
  const {
    submit,
    setAmount,
    amount,
    setAddress,
    address,
    error,
    canSubmit,
    sendFee,
    setTokenBalances,
  } = useSend(sendToken, gasPrice$);
  const [sendAmount, setSendAmount] = useState('0');
  const [sendToAddress, setSendToAddress] = useState('');
  const [sendToTitle, setSendToTitle] = useState('');
  const [sendGasPrice, setSendGasPrice] = useState<string | undefined>();
  const [sendStatus, setSendStatus] = useState<
    'Idle' | 'Sending' | 'Success' | 'Fail'
  >('Idle');
  const [transactionId, setTransactionId] = useState<string>();
  const [gasPriceNAvax, setGasPriceNAvax] = useState(new Big(0));

  const balanceAfterTrx = useMemo(
    () =>
      Utils.bnToBig(
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
    () => (sendFee ? Utils.bnToAvaxC(sendFee) : undefined),
    [sendFee],
  );
  const sendFeeUsd = useMemo(
    () =>
      sendFeeAvax ? Number.parseFloat(sendFeeAvax) * avaxPrice : undefined,
    [sendFeeAvax, avaxPrice],
  );
  const gasPresets = useMemo(() => {
    return {
      ['Normal']: gasPriceNAvax.toFixed(2),
      ['Fast']: gasPriceNAvax.mul(1.05).toFixed(2),
      ['Instant']: gasPriceNAvax.mul(1.15).toFixed(2),
      ['Custom']: '0',
    };
  }, [sendFeeAvax]);

  useEffect(() => {
    if (sendToken?.isErc20) {
      setTokenBalances?.({[(sendToken as ERC20).address]: sendToken as ERC20});
    }
  }, [sendToken]);

  useEffect(() => {
    const sub = gasPrice$
      .pipe(tap(gasPrice => setGasPriceNAvax(Utils.bnToBig(gasPrice.bn, 9))))
      .subscribe();
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    setAmount(
      mustValue(
        () => Utils.stringToBN(sendAmount, sendToken?.denomination ?? 0),
        new BN(0),
      ),
    );
  }, [sendAmount, sendToken]);

  useEffect(() => {
    setAddress(sendToAddress);
  }, [sendToAddress, sendToken]);

  useEffect(() => {
    if (!sendGasPrice) {
      setSendGasPrice(gasPresets.Normal);
    }
  }, [gasPresets]);

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
      firstValueFrom(gasPrice$),
      of(balances) as any,
      sendGasPrice ? Utils.stringToBN(sendGasPrice, 9) : undefined,
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
        console.log('send err', err);
      },
    });
  }

  const tokenLogo = () => {
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
    tokenLogo,
    tokenType,
    canSubmit: canSubmit ?? false,
    sendFeeAvax,
    sendFeeUsd,
    gasPresets,
    setSendGasPrice,
    sendStatus,
    error,
    onSendNow,
    transactionId,
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
