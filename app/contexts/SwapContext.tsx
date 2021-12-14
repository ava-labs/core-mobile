import React, {
  createContext,
  Dispatch,
  useContext,
  useEffect,
  useState,
} from 'react';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import {getSwapRate} from 'swap/getSwapRate';

export interface SwapEntry {
  token: TokenWithBalance | undefined;
  setToken: Dispatch<TokenWithBalance>;
  amount: number;
  setAmount: Dispatch<number>;
  usdValue: string;
}

export interface TrxDetails {
  rate: string;
  slippageTol: string;
  networkFee: string;
  networkFeeUsd: string;
  avaxWalletFee: string;
}

export interface SwapContextState {
  swapFrom: SwapEntry;
  swapTo: SwapEntry;
  swapFromTo: () => void;
  trxDetails: TrxDetails;
}

export const SwapContext = createContext<SwapContextState>({} as any);

export const SwapContextProvider = ({children}: {children: any}) => {
  const [fromToken, setFromToken] = useState<TokenWithBalance>();
  const [fromAmount, setFromAmount] = useState<number>(0);
  const [fromUsdAmount, setFromUsdAmount] = useState<string>('');
  const [toToken, setToToken] = useState<TokenWithBalance>();
  const [toAmount, setToAmount] = useState<number>(0);
  const [toUsdAmount, setToUsdAmount] = useState<string>('');
  const [trxRate, setTrxRate] = useState<string>('1 AVAX ≈ 45.5589 PNG');
  const [slipTol, setSlipTol] = useState<string>('.12%');
  const [networkFee, setNetworkFee] = useState<string>('0.004222 AVAX');
  const [networkFeeUsd, setNetworkFeeUsd] = useState<string>('$0.24 USD');
  const [avaxWalletFee, setAvaxWalletFee] = useState<string>('38213 AVAX');

  useEffect(() => {
    getSwapRate({
      srcToken: fromToken?.address,
      destToken: toToken?.address,
      srcDecimals: fromToken?.denomination,
      destDecimals: toToken?.denomination,
      srcAmount: (
        fromAmount * Math.pow(10, fromToken?.denomination ?? 0)
      ).toString(),
    }).then(val => {
      const result = val.result;
      const destAmount = result.destAmount / Math.pow(10, result.destDecimals);
      const srcAmount = result.srcAmount / Math.pow(10, result.srcDecimals);
      const destAmountBySrcAmount = destAmount / srcAmount;

      setToAmount(destAmount);
      setFromUsdAmount(result.srcUSD);
      setToUsdAmount(result.destUSD);
      setAvaxWalletFee(`${result.partnerFee} AVAX`);
      setTrxRate(
        `1 ${fromToken?.symbol} ≈ ${destAmountBySrcAmount} ${toToken?.symbol}`,
      );
    });
  }, [fromToken, toToken, fromAmount]);

  useEffect(() => {
    console.log('trxRate', trxRate);
    console.log('fromUsdAmount', fromUsdAmount);
    console.log('toUsdAmount', toUsdAmount);
    console.log('avaxWalletFee', avaxWalletFee);
  }, [trxRate, fromUsdAmount, toUsdAmount, avaxWalletFee]);

  const swapFromTo = () => {
    const tempToken = toToken;
    setToToken(fromToken);
    setFromToken(tempToken);
    const tempAmount = toAmount;
    setToAmount(fromAmount);
    setFromAmount(tempAmount);
  };

  const state: SwapContextState = {
    swapFrom: {
      token: fromToken,
      setToken: setFromToken,
      amount: fromAmount,
      setAmount: setFromAmount,
      usdValue: fromUsdAmount,
    },
    swapTo: {
      token: toToken,
      setToken: setToToken,
      amount: toAmount,
      setAmount: setToAmount,
      usdValue: toUsdAmount,
    },
    swapFromTo,
    trxDetails: {
      rate: trxRate,
      slippageTol: slipTol,
      networkFee,
      networkFeeUsd,
      avaxWalletFee,
    },
  };
  return <SwapContext.Provider value={state}>{children}</SwapContext.Provider>;
};

export function useSwapContext() {
  return useContext(SwapContext);
}
