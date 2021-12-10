import React, {createContext, Dispatch, useContext, useState} from 'react';
import {TokenWithBalance} from '@avalabs/wallet-react-components';

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
